/* gounlimited resolver
 * @lscofield
 * GNU
 */

const got = require('got');
const json5 = require('json5');
const unpacker = require('../lib/unpacker');
const skkchecker = require('../lib/skkchecker');
const packedRegex = /(eval\(function\(p,a,c,k,e,d\){.*?}\(.*?\.split\('\|'\)\)\))/;
const jsonRegex = /sources:(\[.*?\])/;

exports.index = function (req, res) {
    //Optional check, only if you need to restrict access
    // to unautorized apps, skk is signature and auth is 
    // unautorized signal
    // see the config file to more info
    const auth = 'auth' in req.body ? req.body.auth : req.query.auth;
    const authJSON = Buffer.from(auth, 'base64').toString('utf8');
    const granted = skkchecker.check(authJSON);
    if (granted != '') {
        // no autorized app block
        // return a random troll video
        // if the app is unautorized
        res.json({ status: 'ok', url: granted });
    } else {
        // autorized app block
        var url = Buffer.from(req.body.source, 'base64').toString('utf8');
        var mp4 = '';

        async function scrape(embedURL) {
            var parsed = null;
            try {
                const { body } = await got(embedURL, {
                    rejectUnauthorized: false
                });

                const packed = packedRegex.exec(body)[1];
                const unpacked = unpacker.unPack(packed);

                const sources = jsonRegex.exec(unpacked);
                parsed = json5.parse(sources[1]);
            } catch (err) { }

            return parsed;
        }


        (async () => {
            const stream = await scrape(url);

            try {
                if (stream)
                    mp4 = stream[0];
            } catch (err) { }

            mp4 = mp4 == null ? '' : mp4;
            res.json({ status: mp4 == '' ? 'error' : 'ok', url: mp4 });
        })();
    }
};