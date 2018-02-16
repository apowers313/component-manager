var ComponentManager = require("../index.js").ComponentManager;
var Component = require("../index.js").Component;
var DefaultLogger = require("../index.js").DefaultLogger;
var ComponentDirector = require("../index.js").ComponentDirector;
var assert = require("chai").assert;
var sinon = require("sinon");

function alwaysTrue() {
    return true;
}

describe("types", function() {
    var cm;
    beforeEach(function() {
        cm = new ComponentManager();
        cm.clear();
    });

    it("can be registered", function() {
        cm.registerType("test-type", function() {});
    });

    it("can be found", function() {
        function foo(a, b, c) {}; // jshint ignore:line
        cm.registerType("test-type", foo);
        var f = cm.getType("test-type");
        assert.strictEqual(f, foo);
        assert.strictEqual(f.length, 3);
        assert.strictEqual(f.name, "foo");
    });

    it("validates registered component");
});

describe("register", function() {
    var cm;
    beforeEach(function() {
        cm = new ComponentManager();
        cm.clear();
    });

    it("can register", function() {
        var testComponent = {};
        cm.registerType("test-type", alwaysTrue);
        cm.register("test-component", "test-type", testComponent);
    });

    it("errors when registering component that doesn't inherit from Component class");

    it("errors when registering with bad type", function() {
        assert.throws(function() {
            cm.register("test-component", 3, {});
        }, TypeError);
    });

    it("errors when registering without module", function() {
        assert.throws(function() {
            cm.register("test-component");
        }, TypeError);
    });

    it("errors when registering without module name", function() {
        var testComponent = {};
        assert.throws(function() {
            cm.register(3, testComponent);
        }, TypeError);
    });
});

describe("registration validation", function() {
    var cm;
    beforeEach(function() {
        cm = new ComponentManager();
        cm.clear();
    });

    it("of simple type passes", function() {
        class Foo {
            bar(a, b, c) {} // jshint ignore:line
        }

        function fooValidator(value) {
            if (typeof value !== "function") return false;
            if (typeof value.prototype !== "object") return false;
            if (typeof value.prototype.bar !== "function") return false;
            if (value.prototype.bar.length !== 3) return false;
            return true;
        }

        cm.registerType("foo-type", fooValidator);
        cm.register("foo-component", "foo-type", Foo);
    });

    it("of simple type fails", function() {
        class Schmoo {
            bar(a, b) {} // jshint ignore:line
        }

        function fooValidator(value) {
            if (typeof value !== "function") return false;
            if (typeof value.prototype !== "object") return false;
            if (typeof value.prototype.bar !== "function") return false;
            if (value.prototype.bar.length !== 3) return false;
            return true;
        }

        cm.registerType("foo-type", fooValidator);
        assert.throws(function() {
            cm.register("foo-component", "foo-type", Schmoo);
        }, Error, "object not a valid type: foo-type");
    });
});

describe("get", function() {
    var cm;
    beforeEach(function() {
        cm = new ComponentManager();
        cm.clear();
        cm.registerType("test-type", alwaysTrue);
        var testComponent = {};
        cm.register("test-component", "test-type", testComponent);
    });

    it("can get components", function() {
        var component = cm.get("test-component");
        assert.isObject(component);
    });

    it("errors when component name not specified during get", function() {
        assert.throws(function() {
            cm.get();
        }, TypeError);
    });

    it("returns undefined when not found", function() {
        var component = cm.get("foo");
        assert.isUndefined(component);
    });
});

describe("config", function() {
    var cm;
    beforeEach(function() {
        cm = new ComponentManager();
        cm.clear();
    });

    it("can configure component", function() {
        var spy = sinon.spy();
        var testComponent = {
            config: spy
        };
        cm.registerType("test-type", alwaysTrue);
        cm.register("test-component", "test-type", testComponent);
        cm.config("test-component", "feature", true);
        assert(spy.called);
        assert.strictEqual(spy.getCall(0).args[0], "feature");
        assert.strictEqual(spy.getCall(0).args[1], true);
    });

    it("config errors when missing feature", function() {
        var testComponent = {
            config: function() {}
        };
        cm.registerType("test-type", alwaysTrue);
        cm.register("test-component", "test-type", testComponent);
        assert.throws(function() {
            cm.config("test-component");
        }, TypeError);
    });

    it("config errors when missing component name", function() {
        var testComponent = {
            config: function() {}
        };
        cm.registerType("test-type", alwaysTrue);
        cm.register("test-component", "test-type", testComponent);
        assert.throws(function() {
            cm.config(3, "feature", true);
        }, TypeError);
    });

    it("config errors when configuring missing component", function() {
        assert.throws(function() {
            cm.config("foo", "feature", true);
        }, TypeError);
    });

    it("config errors module doesn't allow configuration", function() {
        var cm = new ComponentManager();
        var testComponent = {};
        cm.registerType("test-type", alwaysTrue);
        cm.register("test-component", "test-type", testComponent);
        assert.throws(function() {
            cm.config("test-component", "feature", true);
        }, Error);
    });

    it("errors on configuring non-existent feature");
});

describe("lifecycle", function() {
    var cm;
    beforeEach(function() {
        cm = new ComponentManager();
        cm.clear();
    });

    it("can init", function() {
        cm.init();
    });

    it("can shutdown", function() {
        cm.shutdown();
    });

    it("loads default logger");
});

describe("dependencies", function() {
    var cm;
    beforeEach(function() {
        cm = new ComponentManager();
        cm.clear();
        cm.registerType("test-type", alwaysTrue);
    });

    class A extends Component {
        constructor(cm) {
            super(cm);
            this.addDependency("B");
        }
    }

    class B extends Component {
        constructor(cm) {
            super(cm);
            this.addDependency("C");
        }
    }

    class C extends Component {
        constructor(cm) {
            super(cm);
        }
    }

    it("loaded in right order", function() {
        var a = new A(cm);
        // var aSpy = sinon.spy(a.init);
        var b = new B(cm);
        // var bSpy = sinon.spy(b.init);
        var c = new C(cm);
        // var cSpy = sinon.spy(c.init);
        cm.register("A", "test-type", a);
        cm.register("B", "test-type", b);
        cm.register("C", "test-type", c);
        cm.init();
        // TODO: behavior is correct, but spies don't work
        // assert(cSpy.calledBefore(bSpy), "C init before B");
        // assert(bSpy.calledBefore(aSpy), "B init before A");
    });

    it("throws correct error on missing dependency", function() {
        cm.register("A", "test-type", new A(cm));
        assert.throws(function() {
            cm.init();
        }, Error, "'A' cannot find dependency 'B'");
    });

    it("fails on cycle", function() {
        cm.register("A", "test-type", new A(cm));
        cm.register("B", "test-type", new B(cm));
        class Bad extends Component {
            constructor(cm) {
                super(cm)
                this.addDependency("A");
            }
        }
        cm.register("C", "test-type", new Bad(cm));
        assert.throws(function() {
            cm.init();
        }, Error, "Dependency Cycle Found: A -> B -> C -> A");
    });
});

describe("default logger", function() {
    var cm;
    beforeEach(function() {
        cm = new ComponentManager();
        cm.clear();
        cm.registerType("test-type", alwaysTrue);
        cm.init();
    });

    it("exists", function() {
        var logger = cm.get("logger");
        assert.instanceOf(logger, DefaultLogger);
    });

    it("can set level", function() {
        var logger = cm.get("logger");
        logger.config("set-level", "silent");
        assert.strictEqual(logger.debugLevel, 0);
        logger.config("set-level", "error");
        assert.strictEqual(logger.debugLevel, 1);
        logger.config("set-level", 4);
        assert.strictEqual(logger.debugLevel, 4);
    });

    it("errors on bad set levels", function() {
        var logger = cm.get("logger");
        assert.throws(function() {
            logger.config("set-level", "foo");
        }, TypeError, /unknown level while configuring levels:/);
        assert.throws(function() {
            logger.config("set-level", "");
        }, TypeError, /unknown level while configuring levels:/);
        assert.throws(function() {
            logger.config("set-level", -1);
        }, TypeError, /unknown level while configuring levels:/);
        assert.throws(function() {
            logger.config("set-level", 8);
        }, TypeError, /unknown level while configuring levels:/);
    });

    it("can get level", function() {
        var logger = cm.get("logger");
        var lvl;
        // default
        lvl = logger.config("get-level");
        assert.strictEqual(lvl, "debug");

        // error level
        logger.config("set-level", "error");
        lvl = logger.config("get-level");
        assert.strictEqual(lvl, "error");

        // silent level
        logger.config("set-level", 0);
        lvl = logger.config("get-level");
        assert.strictEqual(lvl, "silent");
    });
});

describe("default logger messages", function() {
    var cm;
    var log;
    var spy;
    beforeEach(function() {
        cm = new ComponentManager();
        cm.clear();
        cm.registerType("test-type", alwaysTrue);
        cm.init();
        log = cm.get("logger");
        spy = sinon.spy(console, "log");
    });
    afterEach(function() {
        console.log.restore();
    });

    it("catches right levels", function() {
        log.config("set-level", "error");
        log.error("something bad");
        assert(spy.calledOnce, "one message");
        assert(spy.calledWith("unknown:", "!!! ERROR:", "something bad"), "message format");
        log.warn("will robinson");
        assert(spy.calledOnce, "still one message");
    });

    it("error", function() {
        log.error("something bad");
        assert(spy.calledOnce, "one message");
        assert(spy.calledWith("unknown:", "!!! ERROR:", "something bad"), "message format");
    });

    it("warn", function() {
        log.warn("will robinson");
        assert(spy.calledOnce, "one message");
        assert(spy.calledWith("unknown:", "! WARNING:", "will robinson"), "message format");
    });

    it("info", function() {
        log.info("info test");
        assert(spy.calledOnce, "one message");
        assert(spy.calledWith("unknown:", "info test"), "message format");
    });

    it("verbose", function() {
        log.verbose("verbose test");
        assert(spy.calledOnce, "one message");
        assert(spy.calledWith("unknown:", "verbose test"), "message format");
    });

    it("debug", function() {
        log.debug("debug test");
        assert(spy.calledOnce, "one message");
        assert(spy.calledWith("unknown:", "debug test"), "message format");
    });

    it("silly", function() {
        log.config("set-level", "silly");
        log.silly("silly test");
        assert(spy.calledOnce, "one message");
        assert(spy.calledWith("unknown:", "silly test"), "message format");
    });

    it("silent", function() {
        log.config("set-level", "silent");
        log.error("test");
        log.warn("test");
        log.info("test");
        log.verbose("test");
        log.debug("test");
        log.silly("test");
        assert(spy.notCalled, "not called during silent");
    });
});

describe("component director", function() {
    afterEach(function() {
        return ComponentDirector.stop();
    });

    it("start", function() {
        return ComponentDirector.start()
            .then((cd) => {
                assert.instanceOf(cd, ComponentDirector);
            });
    });

    it("singleton", function() {
        var cd1;
        return ComponentDirector.start()
            .then((cd) => {
                cd1 = cd;
                return ComponentDirector.start();
            })
            .then((cd2) => {
                assert.instanceOf(cd1, ComponentDirector);
                assert.instanceOf(cd2, ComponentDirector);
                assert.strictEqual(cd1, cd2);
            });
    });

    it("stop", function() {
        return ComponentDirector.start();
        // stop called in afterEach
    });

    it("config loads includes", function() {
        var config = {
            includeFiles: [
                "/etc/config.json",
                "config.json",
                "server-config.json"
            ]
        };
        var cd = new ComponentDirector();

        var stub = sinon.stub(ComponentDirector, "readConfig");
        stub
            .withArgs("/etc/config.json")
            .returns({
                includeFiles: [
                    "config.json"
                ]
            });
        stub
            .withArgs("config.json")
            .returns({
                name: "config"
            });
        stub
            .withArgs("server-config.json")
            .returns({});
        var confList = cd.loadConfig(config);

        assert.strictEqual(stub.callCount, 4, "should have tried to load four files");
        assert.deepEqual(confList, [{
            includeFiles: ['/etc/config.json', 'config.json', 'server-config.json']
        }, {
            configDir: "/etc",
            includeFiles: ['config.json']
        }, {
            configDir: process.cwd(),
            name: 'config'
        }, {
            configDir: process.cwd(),
            name: 'config'
        }, {
            configDir: process.cwd()
        }]);

        stub.restore();
    });

    it("config doesn't fail on missing includes", function() {
        var config = {
            includeFiles: [
                "/etc/config.json",
                "config.json",
                "server-config.json"
            ]
        };
        return ComponentDirector
            .start(config)
            .then((cd) => {
                assert.isUndefined(cd.cm.config.configDir);
                assert.isUndefined(cd.cm.config.dataDir);
            });
    });

    it("correctly resolves component names", function() {
        var cd = new ComponentDirector();
        var packageName;
        // See also: https://docs.npmjs.com/cli/install

        // simple package
        packageName = cd.componentResolvePackageName({
            package: "simple-package"
        });
        assert.strictEqual(packageName, "simple-package");
        // versioned package
        packageName = cd.componentResolvePackageName({
            package: "version-package@1.0.0"
        });
        assert.strictEqual(packageName, "version-package@1.0.0");
        // scoped package
        packageName = cd.componentResolvePackageName({
            package: "@myorg/scoped-package@1.0.0"
        });
        assert.strictEqual(packageName, "@myorg/scoped-package@1.0.0");
        // TODO: version range
        // TODO: tag
        // git ssh without user
        packageName = cd.componentResolvePackageName({
            package: "github.com:fido-alliance/fido-2-specs.git"
        });
        assert.strictEqual(packageName, "github.com:fido-alliance/fido-2-specs.git");
        // git ssh with user
        packageName = cd.componentResolvePackageName({
            package: "git@github.com:fido-alliance/fido-2-specs.git"
        });
        assert.strictEqual(packageName, "git@github.com:fido-alliance/fido-2-specs.git");
        // git https with .git
        packageName = cd.componentResolvePackageName({
            package: "https://github.com/fido-alliance/fido-2-specs.git"
        });
        assert.strictEqual(packageName, "https://github.com/fido-alliance/fido-2-specs.git");
        // git https without .git
        packageName = cd.componentResolvePackageName({
            package: "https://github.com/fido-alliance/fido-2-specs"
        });
        assert.strictEqual(packageName, "https://github.com/fido-alliance/fido-2-specs");
        // absolute local .tgz
        packageName = cd.componentResolvePackageName({
            package: "/Users/apowers/package.tgz"
        });
        assert.strictEqual(packageName, "package");
        // relative local .tgz
        packageName = cd.componentResolvePackageName({
            package: "apowers/package2.tgz"
        });
        assert.strictEqual(packageName, "package2");
        // http .tgz
        packageName = cd.componentResolvePackageName({
            package: "http://example.com/foo/bar/webpackage.tgz"
        });
        assert.strictEqual(packageName, "webpackage");
        // https .tgz
        packageName = cd.componentResolvePackageName({
            package: "https://example.com/foo/bar/better-webpackage.tgz"
        });
        assert.strictEqual(packageName, "better-webpackage");
        // directory
        packageName = cd.componentResolvePackageName({
            package: "test/helpers/comp1"
        });
        // directory
        packageName = cd.componentResolvePackageName({
            configDir: "test/helpers",
            package: "comp1"
        });
        assert.strictEqual(packageName, "test-package");
        // empty package name
        packageName = cd.componentResolvePackageName({
            configDir: "test/helpers/comp1",
            package: ""
        });
        assert.strictEqual(packageName, "test-package");
    });

    it("can load config with comments in it");

    it.only("config load component", function() {
        this.timeout(30000);
        this.slow(30000);
        var config = {
            components: [{
                name: "fido-web",
                package: "test/helpers/comp1",
                type: "generic"
            }]
        };
        return ComponentDirector.start(config);
    });

    it("config works with comments");
    it("fails gracefully on bad config");
});