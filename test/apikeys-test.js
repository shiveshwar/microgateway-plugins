const apikey = require('../apikeys/index');
const assert = require('assert');
const denv = require('dotenv');

denv.config();

const apiProd = 'edgemicro_weather';
const apiName = 'weather';
const proxy = { name: apiProd, base_path: '/v1/weatheer' }
const token = { api_product_list: [apiName] }

function* testConfig() {
    let i = 0; while (i < 5) {
        i++; yield {
            "product_to_proxy": [apiProd],
            "product_to_api_resource": {}
        }
    }
}

var [slash, slashstar, slashstarstar, slashstarstar2, customPatternTest] = [...testConfig()];
slash.product_to_api_resource[apiName] = ["/"];
slashstar.product_to_api_resource[apiName] = ["/*"];
slashstarstar.product_to_api_resource[apiName] = ["/**"];
slashstarstar2.product_to_api_resource[apiName] = ["/*/2/**"];
customPatternTest.product_to_api_resource[apiName] = ["/a/b/c"];

describe('apikey plugin', function () {

    var plugin = null;

    //this.timout(0)

    before(() => {
        //
    })


    after((done) => {
        if (plugin) plugin.shutdown();
        done();
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
}); 