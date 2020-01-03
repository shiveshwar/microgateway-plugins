const oauth = require('../oauth/index');
const oauthv2 = require('../oauthv2/index');
//
const assert = require('assert');
const denv = require('dotenv');
denv.config();

const coreObject = require('./microgateway-core');
const logger = coreObject.logger;
const stats = coreObject.stats;

const apiProd = 'edgemicro_weather';
const apiName = 'weather';
const proxy = { name: apiProd, base_path: '/v1/weather' }
const token = { api_product_list: [apiName] }

function* testConfig() {
    let i =0; while ( i<12 ) {  i++; yield {  
      "product_to_proxy": [apiProd],
      "product_to_api_resource": {} 
}}}
var [slash, slashStar, slashStarStar, slashStarStar2, customPattern, customPatternTest, aStar, aDoubleStar, bSlashStar, bSlashStarStar, withEndSlashStar, withEndSlashStarStar2] = [...testConfig()];
      slash.product_to_api_resource[apiName] = ["/"];
      slashStar.product_to_api_resource[apiName] = ["/*"];
      slashStarStar.product_to_api_resource[apiName] = ["/**"];
      slashStarStar2.product_to_api_resource[apiName] = ["/*/2/**"];
      customPattern.product_to_api_resource[apiName] = ["/*", "/a"];
      customPatternTest.product_to_api_resource[apiName] = ["/a/b/c"];
      aStar.product_to_api_resource[apiName] = ["/a*"];
      aDoubleStar.product_to_api_resource[apiName] = ["/a**"];
      bSlashStar.product_to_api_resource[apiName] = ["/a**/b/*"];
      bSlashStarStar.product_to_api_resource[apiName] = ["/a**/b/**"];
      withEndSlashStar.product_to_api_resource[apiName] = ["/*/"];
      withEndSlashStarStar2.product_to_api_resource[apiName] = ["/*/2/**/"];
      

var oauthConfiigDefaults = {
  "authorization-header" : "authorization",
  "api-key-header" : 'x-api-key',
  "keep-authorization-header" : false,
  "cacheKey" : false,
  "gracePeriod" : 0,
  "allowOAuthOnly" : false,
  "allowAPIKeyOnly" : false,
  "productOnly" : false,
  "tokenCache" : false,
  "tokenCacheSize" : 100,
  "allowNoAuthorization" : false,
  "jwk_keys" : undefined,
  "request" : undefined
}

describe('oauth plugin', function() {
  var plugin = null;

  before(() => {
    //
    
  })
  
  beforeEach(() => {
    // environment variables....
    process.env.EDGEMICRO_LOCAL_PROXY = "0"
    process.env.EDGEMICRO_LOCAL = "0"
    process.env.EDGEMICRO_OPENTRACE = false
    //
  });

  after((done) => {
    if ( plugin ) plugin.shutdown();
    done();
  })

  it('will not initialize without a well formed config',(done) => {

    var myplugin = oauth.init(undefined, logger, stats);
    assert(myplugin === undefined)

    myplugin = oauth.init(null, logger, stats);
    assert(myplugin === undefined)

    done();
  })
 
  it('exposes an onrequest handler', (done) => {

    //
    var pluginT = oauth.init(oauthConfiigDefaults, logger, stats);
    assert.ok(pluginT.onrequest);
    //
    done();
  });

  it('runs in local mode',(done) => {
    //
    process.env.EDGEMICRO_LOCAL = "1"

    var req = null;
    var res = null;

    var myplugin = oauth.init(oauthConfiigDefaults, logger, stats);
    myplugin.onrequest(req,res,()=>{
      process.env.EDGEMICRO_LOCAL = "0"
      assert(true)
      done();
    })

  })

  it('takes a default config and bad req and res',(done) => {
    // 
    var req = null;
    var res = null;
    //
    var cb_called = false;
    //
    var cb = () => {
      cb_called = true;
      assert(false)
      done();
    }
    //
    try {
      var pluginT = oauth.init(oauthConfiigDefaults, logger, stats);
      pluginT.onrequest(req,res,cb)
      if ( !cb_called ) {
        assert(true);
      }
      req = {}
      res = {}
      pluginT.onrequest(req,res,cb)
      if ( !cb_called ) {
        assert(true);
        done();
      }
    //
    } catch(e) {
      console.log(e);
      assert(false)
      done()
    }

  })

  it('req and res are empty and default config ', (done) => {
    // 
    //
    var req = {
      headers : {}
    };
    var res = {};
    //
    process.env.EDGEMICRO_LOCAL_PROXY = "1"
    //
    var cb_called = false;
    //
    var cb = () => {
      cb_called = true;
      assert(true)
      done();
    }
    //
    try {
      var pluginT = oauth.init(oauthConfiigDefaults, logger, stats);
      pluginT.onrequest(req,res,cb)
      if ( !cb_called ) {
        assert(false);
        done();
      }
    //
    } catch(e) {
      console.log(e);
      assert(false)
      done()
    }

  })

  // check for / resource path.

  it('checkIfAuthorized for /', function (done) {
    var contains;
    contains = oauth.checkIfAuthorized(slash, `${proxy.base_path}`, proxy, token);  
    assert(contains)
    contains = oauth.checkIfAuthorized(slash, `${proxy.base_path}/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slash, `${proxy.base_path}/1`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slash, `${proxy.base_path}/1/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slash, `${proxy.base_path}/1/2`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slash, `${proxy.base_path}/1/2/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slash, `${proxy.base_path}/1/2/3/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slash, `${proxy.base_path}/1/a/2/3/`, proxy, token);
    assert(contains)
    done()
  })

   // check for /* resource path.

  it('checkIfAuthorized for /*', function (done) {
    var contains;
     contains = oauth.checkIfAuthorized(slashStar, `${proxy.base_path}`, proxy, token);  
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStar, `${proxy.base_path}/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStar, `${proxy.base_path}/1`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slashStar, `${proxy.base_path}/1/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slashStar, `${proxy.base_path}/1/2`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStar, `${proxy.base_path}/1/2/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStar, `${proxy.base_path}/1/2/3/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStar, `${proxy.base_path}/1/a/2/3/`, proxy, token);
    assert(!contains)
    done()
  })
  
   // check for /** resource path.

  it('checkIfAuthorized for /**', function (done) {
    var contains;
   contains = oauth.checkIfAuthorized(slashStarStar, `${proxy.base_path}`, proxy, token);  
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStarStar, `${proxy.base_path}/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStarStar, `${proxy.base_path}/1`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slashStarStar, `${proxy.base_path}/1/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slashStarStar, `${proxy.base_path}/1/2`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slashStarStar, `${proxy.base_path}/1/2/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slashStarStar, `${proxy.base_path}/1/2/3/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slashStarStar, `${proxy.base_path}/1/a/2/3/`, proxy, token);
    assert(contains)
    done()

  })

   // check for /*/2/** resource path.

  it('checkIfAuthorized for  /*/2/**  ', function (done) {
    var contains;
    contains = oauth.checkIfAuthorized(slashStarStar2, `${proxy.base_path}`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStarStar2, `${proxy.base_path}/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStarStar2, `${proxy.base_path}/1`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStarStar2, `${proxy.base_path}/1/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStarStar2, `${proxy.base_path}/1/2`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(slashStarStar2, `${proxy.base_path}/1/2/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slashStarStar2, `${proxy.base_path}/1/2/3/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slashStarStar2, `${proxy.base_path}/1/2/3`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(slashStarStar2, `${proxy.base_path}/1/a/2/3/`, proxy, token);
    assert(!contains)
    done()
  })


   // check for /a/b/c resource path.

   it('checkIfAuthorized for /a/b/c', function (done) {
    var contains;
   contains = oauth.checkIfAuthorized(customPatternTest, `${proxy.base_path}/a/b/c`, proxy, token);  
   assert(contains)
   contains = oauth.checkIfAuthorized(customPatternTest, `${proxy.base_path}/a`, proxy, token);  
   assert(!contains)
   contains = oauth.checkIfAuthorized(customPatternTest, `${proxy.base_path}/a/b`, proxy, token);  
   assert(!contains)
   contains = oauth.checkIfAuthorized(customPatternTest, `${proxy.base_path}/a/b/c/d`, proxy, token);  
   assert(!contains)
   done()
  })

   // check for /*, /a resource path.

   it('checkIfAuthorized for /*, /a', function (done) {
    var contains;
   contains = oauth.checkIfAuthorized(customPattern, `${proxy.base_path}/a/b/c`, proxy, token);  
   assert(!contains)
   contains = oauth.checkIfAuthorized(customPattern, `${proxy.base_path}/a`, proxy, token);  
   assert(contains)
   contains = oauth.checkIfAuthorized(customPattern, `${proxy.base_path}/a/`, proxy, token);  
   assert(contains)
   contains = oauth.checkIfAuthorized(customPattern, `${proxy.base_path}/b`, proxy, token);  
   assert(contains)
   contains = oauth.checkIfAuthorized(customPattern, `${proxy.base_path}/b/`, proxy, token);  
   assert(contains)
   contains = oauth.checkIfAuthorized(customPattern, `${proxy.base_path}/a/b`, proxy, token);  
   assert(!contains)
   contains = oauth.checkIfAuthorized(customPattern, `${proxy.base_path}/a/b/c/d`, proxy, token);  
   assert(!contains)
   done()
  })

   // check for  /a** resource path.

  it('checkIfAuthorized for  /a**  ', function (done) {
    var contains;
    contains = oauth.checkIfAuthorized(aDoubleStar, `${proxy.base_path}/a`, proxy, token);  
    assert(contains)
    contains = oauth.checkIfAuthorized(aDoubleStar, `${proxy.base_path}/a/ds/sd`, proxy, token);  
    assert(contains)
    contains = oauth.checkIfAuthorized(aDoubleStar, `${proxy.base_path}/asdas/b/c`, proxy, token);  
    assert(contains)
    contains = oauth.checkIfAuthorized(aDoubleStar, `${proxy.base_path}/b/c`, proxy, token);  
    assert(!contains)
    contains = oauth.checkIfAuthorized(aDoubleStar, `${proxy.base_path}/#/b/c`, proxy, token);  
    assert(!contains)
    contains = oauth.checkIfAuthorized(aDoubleStar, `${proxy.base_path}/asdfsdffsd/sasdas`, proxy, token);  
    assert(contains)
    contains = oauth.checkIfAuthorized(aDoubleStar, `${proxy.base_path}/avvxd****/222/s/b`, proxy, token);  
    assert(contains)
    done()
  })

  // check for  /a* resource path.

  it('checkIfAuthorized for  /a*  ', function (done) {
    var contains;
    contains = oauth.checkIfAuthorized(aStar, `${proxy.base_path}/a`, proxy, token);  
    assert(!contains)
    contains = oauth.checkIfAuthorized(aStar, `${proxy.base_path}/asdas/`, proxy, token);  
    assert(contains)
    contains = oauth.checkIfAuthorized(aStar, `${proxy.base_path}/asdas/`, proxy, token);  
    assert(contains)
    contains = oauth.checkIfAuthorized(aStar, `${proxy.base_path}/asdas/s/v`, proxy, token);  
    assert(!contains)
    contains = oauth.checkIfAuthorized(aStar, `${proxy.base_path}/asdfsdffsd/sasdas`, proxy, token);  
    assert(!contains)
    contains = oauth.checkIfAuthorized(aStar, `${proxy.base_path}/avvxd****/222`, proxy, token);  
    assert(!contains)
    done()
  })

  // check for /a**/b/* resource path.

  it('checkIfAuthorized for  /a**/b/*  ', function (done) {
    var contains;
    contains = oauth.checkIfAuthorized(bSlashStar, `${proxy.base_path}/a/ds/b/c`, proxy, token);  
    assert(contains)
    contains = oauth.checkIfAuthorized(bSlashStar, `${proxy.base_path}/a/ds/ba/c`, proxy, token);  
    assert(!contains)
    done()
  })

  // check for /a**/b/** */ resource path.

  it('checkIfAuthorized for  /a**/b/**  ', function (done) {
    var contains;
    contains = oauth.checkIfAuthorized(bSlashStarStar, `${proxy.base_path}/a/ds/b/c`, proxy, token);  
    assert(contains)
    contains = oauth.checkIfAuthorized(bSlashStarStar, `${proxy.base_path}/a/ds/ba/c`, proxy, token);  
    assert(!contains)
    done()
  })

  // check for /*/ resource path.

  it('checkIfAuthorized for /*/', function (done) {
    var contains;
     contains = oauth.checkIfAuthorized(withEndSlashStar, `${proxy.base_path}`, proxy, token);  
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStar, `${proxy.base_path}/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStar, `${proxy.base_path}/1`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStar, `${proxy.base_path}/1/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(withEndSlashStar, `${proxy.base_path}/1/2`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStar, `${proxy.base_path}/1/2/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStar, `${proxy.base_path}/1/2/3/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStar, `${proxy.base_path}/1/a/2/3/`, proxy, token);
    assert(!contains)
    done()
  })


// check for /*/2/**/  resource path.

  it('checkIfAuthorized for  /*/2/**/  ', function (done) {
    var contains;
    contains = oauth.checkIfAuthorized(withEndSlashStarStar2, `${proxy.base_path}`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStarStar2, `${proxy.base_path}/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStarStar2, `${proxy.base_path}/1`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStarStar2, `${proxy.base_path}/1/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStarStar2, `${proxy.base_path}/1/2`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStarStar2, `${proxy.base_path}/1/2/`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStarStar2, `${proxy.base_path}/1/2//`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(withEndSlashStarStar2, `${proxy.base_path}/1/2/3/`, proxy, token);
    assert(contains)
    contains = oauth.checkIfAuthorized(withEndSlashStarStar2, `${proxy.base_path}/1/2/3`, proxy, token);
    assert(!contains)
    contains = oauth.checkIfAuthorized(withEndSlashStarStar2, `${proxy.base_path}/1/a/2/3/`, proxy, token);
    assert(!contains)
    done()
  })

  // should be identical for these tests
  var modules = { oauth, oauthv2 }
  for (var name in modules) {

    describe(name, function() {

      var package = modules[name]

      it('exposes an onrequest handler', function() {
          var config = {}
          var plugin = package.init.apply(null, [config, logger, stats]);
          assert.ok(plugin.onrequest);
        });
      
        it('ejectToken where gracePeriod == 0', function() {
          var config = {
              allowOAuthOnly: true,
              allowNoAuthorization: true,
              gracePeriod: 0,
          }
          var plugin = package.init.apply(null, [config, logger, stats])
              
          var cb = (err) => {}
          var req = {headers: {}}
          var res = {}
          plugin.onrequest.apply(null, [req, res, cb]); // called to init vars

          // not expired
          var exp = (new Date().getTime() / 1000) + 5
          assert.ok(!plugin.testing.ejectToken(exp), "should not eject")
      
          // expired
          var exp = new Date().getTime() / 1000 - 5
          assert.ok(plugin.testing.ejectToken(exp), "should eject")
        });
      
        it('ejectToken where gracePeriod != 0', function() {
          var config = {
              allowOAuthOnly: true,
              allowNoAuthorization: true,
              gracePeriod: 5,
          }
          var plugin = package.init.apply(null, [config, logger, stats])
      
          var cb = (err) => {}
          var req = {headers: {}}
          var res = {}
          plugin.onrequest.apply(null, [req, res, cb]); // called to init vars
      
          // not expired
          var exp = (new Date().getTime() / 1000) + 5
          assert.ok(!plugin.testing.ejectToken(exp), "should not eject")
      
          // expired, inside of grace period
          var exp = new Date().getTime() / 1000 - 3
          assert.ok(!plugin.testing.ejectToken(exp), "should not eject")
      
          // expired, outside of grace period
          var exp = new Date().getTime() / 1000 - 6
          assert.ok(plugin.testing.ejectToken(exp), "should eject")
        });
    })
  }
});