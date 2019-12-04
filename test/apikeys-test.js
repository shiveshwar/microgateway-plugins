const apikey = require('../apikeys/index');
const assert = require('assert');
const denv = require('dotenv');

denv.config();

const coreObject = require('./microgateway-core');
const logger = coreObject.logger;
const stats = coreObject.stats;

const apiProd = 'edgemicro_weather';
const apiName = 'weather';
const proxy = { name: apiProd, base_path: '/v1/weatheer' }
const token = { api_product_list: [apiName] }

function* testConfig() {
    let i = 0; while (i < 12) {
        i++; yield {
            "product_to_proxy": [apiName],
            "product_to_api_resource": {}
        }
    }
}

var [slash, slashstar, slashstarstar, slashstarstar2, customPattern, customPatternTest, astar, adoublestar, bslashstar, bslashstarstar, withendslashstar, withendslashstarstar2] = [...testConfig()];
    slash.product_to_api_resource[apiName] = ["/"];
    slashstar.product_to_api_resource[apiName] = ["/*"];
    slashstarstar.product_to_api_resource[apiName] = ["/**"];
    slashstarstar2.product_to_api_resource[apiName] = ["/*/2/**"];
    customPattern.product_to_api_resource[apiName] = ["/*", "/a"];
    customPatternTest.product_to_api_resource[apiName] = ["/a/b/c"];
    astar.product_to_api_resource[apiName] = ["/a*"];
    adoublestar.product_to_api_resource[apiName] = ["/a**"];
    bslashstar.product_to_api_resource[apiName] = ["/a**/b/*"];
    bslashstarstar.product_to_api_resource[apiName] = ["/a**/b/**"];
    withendslashstar.product_to_api_resource[apiName] = ["/*/"];
    withendslashstarstar2.product_to_api_resource[apiName] = ["/*/2/**/"];

var apikeyConfiigDefaults = {
    "api-key-header": 'x-api-key',
    "cacheKey": false,
    "gracePeriod": 0,
    "productOnly": true,
    "allowNoAuthorization": false,
}

describe('apikey plugin', function () {

    var plugin = null;

    before(() => {
        //
    })

    beforeEach(() => {
        process.env.EDGEMICRO_LOCAL_PROXY = "0"
        process.env.EDGEMICRO_LOCAL = "0"
        process.env.EDGEMICRO_OPENTRACE = false
    });

    after((done) => {
        if (plugin) plugin.shutdown();
        done();
    })

    it('will not initialize without a well formed config', (done) => {

        var myplugin = apikey.init(undefined, logger, stats);
        assert(myplugin === undefined)
        myplugin = apikey.init(null, logger, stats);
        assert(myplugin === undefined)
        done();
    })

    it('exposes an onrequest handler', (done) => {
        var pluginT = apikey.init(apikeyConfiigDefaults, logger, stats);
        assert.ok(pluginT.onrequest);
        done();
    });

    it('runs in local mode', (done) => {
        process.env.EDGEMICRO_LOCAL = "1"
        var req = null;
        var res = null;

        var myplugin = apikey.init(apikeyConfiigDefaults, logger, stats);
        myplugin.onrequest(req, res, () => {
            process.env.EDGEMICRO_LOCAL = "0"
            assert(true)
            done();
        })
    })

    it('takes a default config and bad req and res', (done) => {
        var req = null;
        var res = null;

        var cb_called = false;
        var cb = () => {
            cb_called = true;
            assert(false)
            done();
        }

        try {
            var pluginT = apikey.init(apikeyConfiigDefaults, logger, stats);
            pluginT.onrequest(req, res, cb)
            if (!cb_called) {
                assert(true);
            }
            req = {}
            res = {}
            pluginT.onrequest(req, res, cb)
            if (!cb_called) {
                assert(true);
                done();
            }
        } catch (e) {
            console.log(e);
            assert(false)
            done()
        }

    })

    it('req and res are empty and default config ', (done) => {
        var req = {
            headers: {}
        };
        var res = {
            setHeader: function () { },
            end: function () { }
        };

        process.env.EDGEMICRO_LOCAL_PROXY = "1"

        var cb_called = false;
        var cb = () => {
            cb_called = true;
            assert(true)
            done();
        }
        try {
            var pluginT = apikey.init(apikeyConfiigDefaults, logger, stats);
            pluginT.onrequest(req, res, cb)
            if (!cb_called) {
                assert(false);
                done();
            }
        } catch (e) {
            console.log(e);
            assert(false)
            done()
        }
    })

    // check for / resource path.
    
    it('checkIfAuthorized for /', function (done) {
        var contains;
        contains = apikey.checkIfAuthorized(slash, `${proxy.base_path}`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slash, `${proxy.base_path}/`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slash, `${proxy.base_path}/1`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slash, `${proxy.base_path}/1/`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slash, `${proxy.base_path}/1/2`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slash, `${proxy.base_path}/1/2/`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slash, `${proxy.base_path}/1/2/3/`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slash, `${proxy.base_path}/1/a/2/3/`, proxy, token);
        assert(contains)
        done()
    })

    // check for /* resource path.

    it('checkIfAuthorized for /*', function (done) {
        var contains;
        contains = apikey.checkIfAuthorized(slashstar, `${proxy.base_path}`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstar, `${proxy.base_path}/`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstar, `${proxy.base_path}/1`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slashstar, `${proxy.base_path}/1/`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slashstar, `${proxy.base_path}/1/2`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstar, `${proxy.base_path}/1/2/`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstar, `${proxy.base_path}/1/2/3/`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstar, `${proxy.base_path}/1/a/2/3/`, proxy, token);
        assert(!contains)
        done()
    })

    // check for /** resource path.

    it('checkIfAuthorized for /**', function (done) {
        var contains;
        contains = apikey.checkIfAuthorized(slashstarstar, `${proxy.base_path}`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstarstar, `${proxy.base_path}/`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstarstar, `${proxy.base_path}/1`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slashstarstar, `${proxy.base_path}/1/`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slashstarstar, `${proxy.base_path}/1/2`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slashstarstar, `${proxy.base_path}/1/2/`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slashstarstar, `${proxy.base_path}/1/2/3/`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slashstarstar, `${proxy.base_path}/1/a/2/3/`, proxy, token);
        assert(contains)
        done()

    })

    // check for /*/2/** resource path.

    it('checkIfAuthorized for  /*/2/**  ', function (done) {
        var contains;
        contains = apikey.checkIfAuthorized(slashstarstar2, `${proxy.base_path}`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstarstar2, `${proxy.base_path}/`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstarstar2, `${proxy.base_path}/1`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstarstar2, `${proxy.base_path}/1/`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstarstar2, `${proxy.base_path}/1/2`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstarstar2, `${proxy.base_path}/1/2/`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slashstarstar2, `${proxy.base_path}/1/2/3/`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slashstarstar2, `${proxy.base_path}/1/2/3/4/`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(slashstarstar2, `${proxy.base_path}/1/s/2/3/4/`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(slashstarstar2, `${proxy.base_path}/1/a/2/3/`, proxy, token);
        assert(!contains)
        done()
    })

    // check for /a/b/c resource path.

    it('checkIfAuthorized for /a/b/c', function (done) {
        var contains;
        contains = apikey.checkIfAuthorized(customPatternTest, `${proxy.base_path}/a/b/c`, proxy, token);
        assert(contains)
        contains = apikey.checkIfAuthorized(customPatternTest, `${proxy.base_path}/a`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(customPatternTest, `${proxy.base_path}/a/b`, proxy, token);
        assert(!contains)
        contains = apikey.checkIfAuthorized(customPatternTest, `${proxy.base_path}/a/b/c/d`, proxy, token);
        assert(!contains)
        done()
    })

    // check for /*, /a resource path.

   it('checkIfAuthorized for /*, /a', function (done) {
    var contains;
   contains = apikey.checkIfAuthorized(customPattern, `${proxy.base_path}/a/b/c`, proxy, token);  
   assert(!contains)
   contains = apikey.checkIfAuthorized(customPattern, `${proxy.base_path}/a`, proxy, token);  
   assert(contains)
   contains = apikey.checkIfAuthorized(customPattern, `${proxy.base_path}/a/`, proxy, token);  
   assert(contains)
   contains = apikey.checkIfAuthorized(customPattern, `${proxy.base_path}/b`, proxy, token);  
   assert(contains)
   contains = apikey.checkIfAuthorized(customPattern, `${proxy.base_path}/b/`, proxy, token);  
   assert(contains)
   contains = apikey.checkIfAuthorized(customPattern, `${proxy.base_path}/a/b`, proxy, token);  
   assert(!contains)
   contains = apikey.checkIfAuthorized(customPattern, `${proxy.base_path}/a/b/c/d`, proxy, token);  
   assert(!contains)
   done()
  })

    // check for  /a** resource path.

  it('checkIfAuthorized for  /a**  ', function (done) {
    var contains;
    contains = apikey.checkIfAuthorized(adoublestar, `${proxy.base_path}/a`, proxy, token);  
    assert(contains)
    contains = apikey.checkIfAuthorized(adoublestar, `${proxy.base_path}/a/ds/sd`, proxy, token);  
    assert(contains)
    contains = apikey.checkIfAuthorized(adoublestar, `${proxy.base_path}/asdas/b/c`, proxy, token);  
    assert(contains)
    contains = apikey.checkIfAuthorized(adoublestar, `${proxy.base_path}/b/c`, proxy, token);  
    assert(!contains)
    contains = apikey.checkIfAuthorized(adoublestar, `${proxy.base_path}/#/b/c`, proxy, token);  
    assert(!contains)
    contains = apikey.checkIfAuthorized(adoublestar, `${proxy.base_path}/asdfsdffsd/sasdas`, proxy, token);  
    assert(contains)
    contains = apikey.checkIfAuthorized(adoublestar, `${proxy.base_path}/avvxd****/222/s/b`, proxy, token);  
    assert(contains)
    done()
  })

  // check for  /a* resource path.

  it('checkIfAuthorized for  /a*  ', function (done) {
    var contains;
    contains = apikey.checkIfAuthorized(astar, `${proxy.base_path}/a`, proxy, token);  
    assert(!contains)
    contains = apikey.checkIfAuthorized(astar, `${proxy.base_path}/asdas/`, proxy, token);  
    assert(contains)
    contains = apikey.checkIfAuthorized(astar, `${proxy.base_path}/asdas/`, proxy, token);  
    assert(contains)
    contains = apikey.checkIfAuthorized(astar, `${proxy.base_path}/asdas/s/v`, proxy, token);  
    assert(!contains)
    contains = apikey.checkIfAuthorized(astar, `${proxy.base_path}/asdfsdffsd/sasdas`, proxy, token);  
    assert(!contains)
    contains = apikey.checkIfAuthorized(astar, `${proxy.base_path}/avvxd****/222`, proxy, token);  
    assert(!contains)
    done()
  })

  // check for /a**/b/* resource path.

  it('checkIfAuthorized for  /a**/b/*  ', function (done) {
    var contains;
    contains = apikey.checkIfAuthorized(bslashstar, `${proxy.base_path}/a/ds/b/c`, proxy, token);  
    assert(contains)
    contains = apikey.checkIfAuthorized(bslashstar, `${proxy.base_path}/a/ds/ba/c`, proxy, token);  
    assert(!contains)
    done()
  })

  // check for /a**/b/** */ resource path.

  it('checkIfAuthorized for  /a**/b/**  ', function (done) {
    var contains;
    contains = apikey.checkIfAuthorized(bslashstarstar, `${proxy.base_path}/a/ds/b/c`, proxy, token);  
    assert(contains)
    contains = apikey.checkIfAuthorized(bslashstarstar, `${proxy.base_path}/a/ds/ba/c`, proxy, token);  
    assert(!contains)
    done()
  })

  // check for /*/ resource path.

  it('checkIfAuthorized for /*/', function (done) {
    var contains;
     contains = apikey.checkIfAuthorized(withendslashstar, `${proxy.base_path}`, proxy, token);  
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstar, `${proxy.base_path}/`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstar, `${proxy.base_path}/1`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstar, `${proxy.base_path}/1/`, proxy, token);
    assert(contains)
    contains = apikey.checkIfAuthorized(withendslashstar, `${proxy.base_path}/1/2`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstar, `${proxy.base_path}/1/2/`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstar, `${proxy.base_path}/1/2/3/`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstar, `${proxy.base_path}/1/a/2/3/`, proxy, token);
    assert(!contains)
    done()
  })


// check for /*/2/**/  resource path.

  it('checkIfAuthorized for  /*/2/**/  ', function (done) {
    var contains;
    contains = apikey.checkIfAuthorized(withendslashstarstar2, `${proxy.base_path}`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstarstar2, `${proxy.base_path}/`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstarstar2, `${proxy.base_path}/1`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstarstar2, `${proxy.base_path}/1/`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstarstar2, `${proxy.base_path}/1/2`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstarstar2, `${proxy.base_path}/1/2/`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstarstar2, `${proxy.base_path}/1/2//`, proxy, token);
    assert(contains)
    contains = apikey.checkIfAuthorized(withendslashstarstar2, `${proxy.base_path}/1/2/3/`, proxy, token);
    assert(contains)
    contains = apikey.checkIfAuthorized(withendslashstarstar2, `${proxy.base_path}/1/2/3`, proxy, token);
    assert(!contains)
    contains = apikey.checkIfAuthorized(withendslashstarstar2, `${proxy.base_path}/1/a/2/3/`, proxy, token);
    assert(!contains)
    done()
  })

}); 