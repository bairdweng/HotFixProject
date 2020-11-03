var global = this;

(function() {
    var _ocCls = {};
    var _jsCls = {};
    /// 把 oc 转化为 js 对象
    var _formatOCToJS = function(obj) {
        // 如果 oc 端返回的直接是 undefined 或者 null，那么直接返回 false
        if (obj === undefined || obj === null) return false
            if (typeof obj == "object") {
                // js 传给 oc 时会把自己包裹在 __obj 中。因此，存在 __obj 就可以直接拿到 js 对象
                if (obj.__obj) return obj
                    // 如果是空，那么直接返回 false。因为如果返回 null 的话，就无法调用方法了。
                    if (obj.__isNil) return false
                        }
        // 如果是数组，要对每一个 oc 转 js 一下
        if (obj instanceof Array) {
            var ret = []
            obj.forEach(function(o) {
                ret.push(_formatOCToJS(o))
            })
            return ret
        }
        if (obj instanceof Function) {
            return function() {
                var args = Array.prototype.slice.call(arguments)
                // 如果 oc 传给 js 的是一个函数，那么 js 端调用的时候就需要先把 js 参数转为 oc 对象，调用。
                var formatedArgs = _OC_formatJSToOC(args)
                for (var i = 0; i < args.length; i++) {
                    if (args[i] === null || args[i] === undefined || args[i] === false) {
                        formatedArgs.splice(i, 1, undefined)
                    } else if (args[i] == nsnull) {
                        formatedArgs.splice(i, 1, null)
                    }
                }
                // 在调用完 oc 方法后，又要 oc 对象转为 js 对象回传给 oc
                return _OC_formatOCToJS(obj.apply(obj, formatedArgs))
            }
        }
        if (obj instanceof Object) {
            // 如果是一个 object 并且没有 __obj，那么把所有的 key 都 format 一遍
            var ret = {}
            for (var key in obj) {
                ret[key] = _formatOCToJS(obj[key])
            }
            return ret
        }
        return obj
    }
    // 把要调用的方法名类名，参数传递给 oc
    var _methodFunc = function(instance, clsName, methodName, args, isSuper, isPerformSelector) {
        var selectorName = methodName
        // js 端的方法都是 xxx_xxx 的形式，而 oc 端的方法已经在 defineClass 的时候转为了 xxx:xxx: 的形式。所以一般情况下 js 调用 oc 方法的时候都需要先把方法名转换一下。也就是当 isPerformSelector 为 false 的情况。
        // 那么什么时候这个属性为 true 呢？当 js 端调用 performSelector 这个的方法的时候。这个方法默认需要传入 xxx:xxx: 形式的 OC selector 名。
        // 一般 performSelector 用于从 oc 端动态传来 selectorName 需要 js 执行的时候。没有太多的使用场景
        if (!isPerformSelector) {
            methodName = methodName.replace(/__/g, "-")
            selectorName = methodName.replace(/_/g, ":").replace(/-/g, "_")
            var marchArr = selectorName.match(/:/g)
            var numOfArgs = marchArr ? marchArr.length : 0
            if (args.length > numOfArgs) {
                selectorName += ":"
            }
        }
        var ret = instance ? _OC_callI(instance, selectorName, args, isSuper):
        _OC_callC(clsName, selectorName, args)
        return _formatOCToJS(ret)
    }
    
    /// 调用 native 相应的方法 类似uibutton alloc等
    var _customMethods = {
    __c: function(methodName) {
        var slf = this
        // 如果 oc 返回了一个空对象，在 js 端会以 false 的形式接受。当这个空对象再调用方法的时候，就会走到这个分支中，直接返回 false，而不会走 oc 的消息转发
        if (slf instanceof Boolean) {
            return function() {
                return false
            }
        }
        if (slf[methodName]) {
            return slf[methodName].bind(slf);
        }
        /// 如果当前调用的父类的方法，那么通过 OC 方法获取该 clsName 的父类的名字
        if (!slf.__obj && !slf.__clsName) {
            throw new Error(slf + '.' + methodName + ' is undefined')
        }
        if (slf.__isSuper && slf.__clsName) {
            slf.__clsName = _OC_superClsName(slf.__obj.__realClsName ? slf.__obj.__realClsName: slf.__clsName);
        }
        var clsName = slf.__clsName
        if (clsName && _ocCls[clsName]) {
            /// 根据 __obj 字段判断是否是实例方法或者类方法
            var methodType = slf.__obj ? 'instMethods': 'clsMethods'
            /// 如果当前方法是提前定义的方法，那么直接走定义方法的调用
            if (_ocCls[clsName][methodType][methodName]) {
                slf.__isSuper = 0;
                return _ocCls[clsName][methodType][methodName].bind(slf)
            }
        }
        /// 当前方法不是在 js 中定义的，那么直接调用 oc 的方法
        return function(){
            var args = Array.prototype.slice.call(arguments)
            return _methodFunc(slf.__obj, slf.__clsName, methodName, args, slf.__isSuper)
        }
    },
        
        super: function() {
            var slf = this
            if (slf.__obj) {
                slf.__obj.__realClsName = slf.__realClsName;
            }
            return {__obj: slf.__obj, __clsName: slf.__clsName, __isSuper: 1}
        },
        
    performSelectorInOC: function() {
        var slf = this
        var args = Array.prototype.slice.call(arguments)
        return {__isPerformInOC:1, obj:slf.__obj, clsName:slf.__clsName, sel: args[0], args: args[1], cb: args[2]}
    },
        
    performSelector: function() {
        var slf = this
        var args = Array.prototype.slice.call(arguments)
        return _methodFunc(slf.__obj, slf.__clsName, args[0], args.splice(1), slf.__isSuper, true)
    }
    }
    
    for (var method in _customMethods) {
        if (_customMethods.hasOwnProperty(method)) {
            Object.defineProperty(Object.prototype, method, {value: _customMethods[method], configurable:false, enumerable: false})
        }
    }
    // 通过 require 方法创建全局类对象
    var _require = function(clsName) {
        if (!global[clsName]) {
            global[clsName] = {
            __clsName: clsName
            }
        }
        return global[clsName]
    }
    // 全局创建对象的方法，直接为 require 的类创建一个它的对象
    global.require = function() {
        var lastRequire
        for (var i = 0; i < arguments.length; i ++) {
            arguments[i].split(',').forEach(function(clsName) {
                lastRequire = _require(clsName.trim())
            })
        }
        return lastRequire
    }
    /* 对 js 端定义的 method 进行预处理，取出方法的参数个数。hook 方法，预处理方法的参数，将其转为 js 对象。
     这个方法是要添加到 oc 端的，oc 端需要知道参数个数，但是 oc 端无法直接获取，只能通过解析方法名。因此就把解析参数个数的工程放在了 js 中进行。js 端在将方法传给 oc 前，先把参数个数拿到，然后以数组形式传递。
     oc 调用 js 方法时传递的参数需要预处理，比如调用对象原本是 js 传递过去的，就会被 {__obj: xxx} 包裹，再比如 oc 的空对象的处理。
     oc 传来的参数第一个是方法的调用上下文。因此需要把调用上下文设置给全局的 self，以便在方法中使用。在调用方法前，还需要把这个上下文和 Selector 从参数列表中取出，因为 js 调用的时候是不需要这个参数的。
     */
    var _formatDefineMethods = function(methods, newMethods, realClsName) {
        for (var methodName in methods) {
            if (!(methods[methodName] instanceof Function)) return;
            (function(){
                var originMethod = methods[methodName]
                // 把原来的 method 拿出来，新的 method 变成了一个数组，第一个参数是原来方法的调用参数的个数，第二个参数是
                // 因为runtime 添加方法的时候需要设置函数签名，因此需要知道方法中参数个数。这里直接在 js 中将参数个数取出
                newMethods[methodName] = [originMethod.length, function() {
                    try {
                        // js 端执行的方法，需要先把参数转为 js 的类型
                        var args = _formatOCToJS(Array.prototype.slice.call(arguments))
                        // 暂存之前的 self 对象
                        var lastSelf = global.self
                        // oc 调用 js 方法的时候，默认第一个参数是 self
                        global.self = args[0]
                        if (global.self) global.self.__realClsName = realClsName
                            // oc 调用 js 方法的时候，第一个参数是 self，因此要把它去掉。
                            args.splice(0,1)
                            // 调用 js 方法
                            var ret = originMethod.apply(originMethod, args)
                            // 恢复 原始的 self 指向
                            global.self = lastSelf
                            return ret
                            } catch(e) {
                                _OC_catch(e.message, e.stack)
                            }
                }]
            })()
        }
    }
    // 替换 this 为 self
    var _wrapLocalMethod = function(methodName, func, realClsName) {
        return function() {
            var lastSelf = global.self
            global.self = this
            this.__realClsName = realClsName
            var ret = func.apply(this, arguments)
            global.self = lastSelf
            return ret
        }
    }
    //   保存方法到 _ocCls 中
    var _setupJSMethod = function(className, methods, isInst, realClsName) {
        for (var name in methods) {
            var key = isInst ? 'instMethods': 'clsMethods',
            func = methods[name]
            _ocCls[className][key][name] = _wrapLocalMethod(name, func, realClsName)
        }
    }
    
    // 返回属性的 get 方法
    var _propertiesGetFun = function(name){
        return function(){
            var slf = this;
            if (!slf.__ocProps) {
                var props = _OC_getCustomProps(slf.__obj)
                if (!props) {
                    props = {}
                    _OC_setCustomProps(slf.__obj, props)
                }
                // 将 oc 的关联属性赋给 js 端对象的 __ocProps
                slf.__ocProps = props;
            }
            return slf.__ocProps[name];
        };
    }
    // 返回属性的 set 方法
    var _propertiesSetFun = function(name){
        return function(jval){
            var slf = this;
            if (!slf.__ocProps) {
                var props = _OC_getCustomProps(slf.__obj)
                if (!props) {
                    props = {}
                    _OC_setCustomProps(slf.__obj, props)
                }
                slf.__ocProps = props;
            }
            slf.__ocProps[name] = jval;
        };
    }
    // jShook方法实在太方便
    /*
     对于定义好的方法，js 端需要把这些方法保存起来。毕竟真正的实现还是在 js 端进行的。因此定义了一个所有类的方法的暂存地：__ocCls。所有的类的所有方法都会被保存在这个对象中。
     */
    global.defineClass = function(declaration, properties, instMethods, clsMethods) {
        var newInstMethods = {}, newClsMethods = {}
        if (!(properties instanceof Array)) {
            clsMethods = instMethods
            instMethods = properties
            properties = null
        }
        // 如果存在 properties，在实例方法列表中增加各种 get set 方法
        if (properties) {
            properties.forEach(function(name){
                if (!instMethods[name]) {
                    // 将 get 方法设置到实例方法中
                    instMethods[name] = _propertiesGetFun(name);
                }
                // 设置属性的 set 方法
                var nameOfSet = "set"+ name.substr(0,1).toUpperCase() + name.substr(1);
                if (!instMethods[nameOfSet]) {
                    // 将 set 方法设置到实例方法中
                    instMethods[nameOfSet] = _propertiesSetFun(name);
                }
            });
        }
        // realClsName 是 js 中直接截取的类名
        var realClsName = declaration.split(':')[0].trim()
        // 预处理要定义的方法，对方法进行切片，处理参数
        _formatDefineMethods(instMethods, newInstMethods, realClsName)
        _formatDefineMethods(clsMethods, newClsMethods, realClsName)
        // 在 OC 中定义这个类，返回的值类型为 {cls: xxx, superCls: xxx}
        var ret = _OC_defineClass(declaration, newInstMethods, newClsMethods)
        // className 是从 OC 中截取的 cls 的名字。本质上和 realClsName 是一致的
        var className = ret['cls']
        var superCls = ret['superCls']
        // 初始化该类的类方法和实例方法到 _ocCls 中
        _ocCls[className] = {
        instMethods: {},
        clsMethods: {},
        }
        
        if (superCls.length && _ocCls[superCls]) {
            for (var funcName in _ocCls[superCls]['instMethods']) {
                _ocCls[className]['instMethods'][funcName] = _ocCls[superCls]['instMethods'][funcName]
            }
            for (var funcName in _ocCls[superCls]['clsMethods']) {
                _ocCls[className]['clsMethods'][funcName] = _ocCls[superCls]['clsMethods'][funcName]
            }
        }
        // 把方法存到 _ocCls 对应的类中。和 _formatDefineMethods 的差别在于这个方法不需要把参数个数提取出来
        _setupJSMethod(className, instMethods, 1, realClsName)
        _setupJSMethod(className, clsMethods, 0, realClsName)
        
        return require(className)
    }
    // 在 JS 端定义协议非常简单，和创建类差不多，传入类名，类方法和实例方法：
    global.defineProtocol = function(declaration, instProtos , clsProtos) {
        var ret = _OC_defineProtocol(declaration, instProtos,clsProtos);
        return ret
    }
    
    global.block = function(args, cb) {
        var that = this
        var slf = global.self
        if (args instanceof Function) {
            cb = args
            args = ''
        }
        var callback = function() {
            var args = Array.prototype.slice.call(arguments)
            global.self = slf
            return cb.apply(that, _formatOCToJS(args))
        }
        var ret = {args: args, cb: callback, argCount: cb.length, __isBlock: 1}
        if (global.__genBlock) {
            ret['blockObj'] = global.__genBlock(args, cb)
        }
        return ret
    }
    
    if (global.console) {
        var jsLogger = console.log;
        global.console.log = function() {
            global._OC_log.apply(global, arguments);
            if (jsLogger) {
                jsLogger.apply(global.console, arguments);
            }
        }
    } else {
        global.console = {
        log: global._OC_log
        }
    }
    
    global.defineJSClass = function(declaration, instMethods, clsMethods) {
        var o = function() {},
        a = declaration.split(':'),
        clsName = a[0].trim(),
        superClsName = a[1] ? a[1].trim() : null
        o.prototype = {
        init: function() {
            if (this.super()) this.super().init()
                return this;
        },
            super: function() {
                return superClsName ? _jsCls[superClsName].prototype : null
            }
        }
        var cls = {
        alloc: function() {
            return new o;
        }
        }
        for (var methodName in instMethods) {
            o.prototype[methodName] = instMethods[methodName];
        }
        for (var methodName in clsMethods) {
            cls[methodName] = clsMethods[methodName];
        }
        global[clsName] = cls
        _jsCls[clsName] = o
    }
    
    global.YES = 1
    global.NO = 0
    global.nsnull = _OC_null
    global._formatOCToJS = _formatOCToJS
    
})()
