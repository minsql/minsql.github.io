var requirejs,require,define;!function(global,setTimeout){function commentReplace(e,t){return t||""}function isFunction(e){return"[object Function]"===ostring.call(e)}function isArray(e){return"[object Array]"===ostring.call(e)}function each(e,t){if(e){var n;for(n=0;n<e.length&&(!e[n]||!t(e[n],n,e));n+=1);}}function eachReverse(e,t){if(e){var n;for(n=e.length-1;n>-1&&(!e[n]||!t(e[n],n,e));n-=1);}}function hasProp(e,t){return hasOwn.call(e,t)}function getOwn(e,t){return hasProp(e,t)&&e[t]}function eachProp(e,t){var n;for(n in e)if(hasProp(e,n)&&t(e[n],n))break}function mixin(e,t,n,r){return t&&eachProp(t,function(t,i){!n&&hasProp(e,i)||(!r||"object"!=typeof t||!t||isArray(t)||isFunction(t)||t instanceof RegExp?e[i]=t:(e[i]||(e[i]={}),mixin(e[i],t,n,r)))}),e}function bind(e,t){return function(){return t.apply(e,arguments)}}function scripts(){return document.getElementsByTagName("script")}function defaultOnError(e){throw e}function getGlobal(e){if(!e)return e;var t=global;return each(e.split("."),function(e){t=t[e]}),t}function makeError(e,t,n,r){var i=Error(t+"\nhttp://requirejs.org/docs/errors.html#"+e);return i.requireType=e,i.requireModules=r,n&&(i.originalError=n),i}function newContext(e){function t(e){var t,n;for(t=0;t<e.length;t++)if(n=e[t],"."===n)e.splice(t,1),t-=1;else if(".."===n){if(0===t||1===t&&".."===e[2]||".."===e[t-1])continue;t>0&&(e.splice(t-1,2),t-=2)}}function n(e,n,r){var i,o,a,s,c,u,d,f,l,p,h,m,g=n&&n.split("/"),b=E.map,v=b&&b["*"];if(e&&(e=e.split("/"),d=e.length-1,E.nodeIdCompat&&jsSuffixRegExp.test(e[d])&&(e[d]=e[d].replace(jsSuffixRegExp,"")),"."===e[0].charAt(0)&&g&&(m=g.slice(0,g.length-1),e=m.concat(e)),t(e),e=e.join("/")),r&&b&&(g||v)){a=e.split("/");e:for(s=a.length;s>0;s-=1){if(u=a.slice(0,s).join("/"),g)for(c=g.length;c>0;c-=1)if(o=getOwn(b,g.slice(0,c).join("/")),o&&(o=getOwn(o,u))){f=o,l=s;break e}!p&&v&&getOwn(v,u)&&(p=getOwn(v,u),h=s)}!f&&p&&(f=p,l=h),f&&(a.splice(0,l,f),e=a.join("/"))}return i=getOwn(E.pkgs,e),i?i:e}function r(e){isBrowser&&each(scripts(),function(t){if(t.getAttribute("data-requiremodule")===e&&t.getAttribute("data-requirecontext")===x.contextName)return t.parentNode.removeChild(t),!0})}function i(e){var t=getOwn(E.paths,e);if(t&&isArray(t)&&t.length>1)return t.shift(),x.require.undef(e),x.makeRequire(null,{skipMap:!0})([e]),!0}function o(e){var t,n=e?e.indexOf("!"):-1;return n>-1&&(t=e.substring(0,n),e=e.substring(n+1,e.length)),[t,e]}function a(e,t,r,i){var a,s,c,u,d=null,f=t?t.name:null,l=e,p=!0,h="";return e||(p=!1,e="_@r"+(P+=1)),u=o(e),d=u[0],e=u[1],d&&(d=n(d,f,i),s=getOwn(O,d)),e&&(d?h=r?e:s&&s.normalize?s.normalize(e,function(e){return n(e,f,i)}):e.indexOf("!")===-1?n(e,f,i):e:(h=n(e,f,i),u=o(h),d=u[0],h=u[1],r=!0,a=x.nameToUrl(h))),c=!d||s||r?"":"_unnormalized"+(N+=1),{prefix:d,name:h,parentMap:t,unnormalized:!!c,url:a,originalName:l,isDefine:p,id:(d?d+"!"+h:h)+c}}function s(e){var t=e.id,n=getOwn(k,t);return n||(n=k[t]=new x.Module(e)),n}function c(e,t,n){var r=e.id,i=getOwn(k,r);!hasProp(O,r)||i&&!i.defineEmitComplete?(i=s(e),i.error&&"error"===t?n(i.error):i.on(t,n)):"defined"===t&&n(O[r])}function u(e,t){var n=e.requireModules,r=!1;t?t(e):(each(n,function(t){var n=getOwn(k,t);n&&(n.error=e,n.events.error&&(r=!0,n.emit("error",e)))}),r||req.onError(e))}function d(){globalDefQueue.length&&(each(globalDefQueue,function(e){var t=e[0];"string"==typeof t&&(x.defQueueMap[t]=!0),M.push(e)}),globalDefQueue=[])}function f(e){delete k[e],delete j[e]}function l(e,t,n){var r=e.map.id;e.error?e.emit("error",e.error):(t[r]=!0,each(e.depMaps,function(r,i){var o=r.id,a=getOwn(k,o);!a||e.depMatched[i]||n[o]||(getOwn(t,o)?(e.defineDep(i,O[o]),e.check()):l(a,t,n))}),n[r]=!0)}function p(){var e,t,n=1e3*E.waitSeconds,o=n&&x.startTime+n<(new Date).getTime(),a=[],s=[],c=!1,d=!0;if(!v){if(v=!0,eachProp(j,function(e){var n=e.map,u=n.id;if(e.enabled&&(n.isDefine||s.push(e),!e.error))if(!e.inited&&o)i(u)?(t=!0,c=!0):(a.push(u),r(u));else if(!e.inited&&e.fetched&&n.isDefine&&(c=!0,!n.prefix))return d=!1}),o&&a.length)return e=makeError("timeout","Load timeout for modules: "+a,null,a),e.contextName=x.contextName,u(e);d&&each(s,function(e){l(e,{},{})}),o&&!t||!c||!isBrowser&&!isWebWorker||w||(w=setTimeout(function(){w=0,p()},50)),v=!1}}function h(e){hasProp(O,e[0])||s(a(e[0],null,!0)).init(e[1],e[2])}function m(e,t,n,r){e.detachEvent&&!isOpera?r&&e.detachEvent(r,t):e.removeEventListener(n,t,!1)}function g(e){var t=e.currentTarget||e.srcElement;return m(t,x.onScriptLoad,"load","onreadystatechange"),m(t,x.onScriptError,"error"),{node:t,id:t&&t.getAttribute("data-requiremodule")}}function b(){var e;for(d();M.length;){if(e=M.shift(),null===e[0])return u(makeError("mismatch","Mismatched anonymous define() module: "+e[e.length-1]));h(e)}x.defQueueMap={}}var v,y,x,q,w,E={waitSeconds:7,baseUrl:"./",paths:{},bundles:{},pkgs:{},shim:{},config:{}},k={},j={},S={},M=[],O={},_={},T={},P=1,N=1;return q={require:function(e){return e.require?e.require:e.require=x.makeRequire(e.map)},exports:function(e){if(e.usingExports=!0,e.map.isDefine)return e.exports?O[e.map.id]=e.exports:e.exports=O[e.map.id]={}},module:function(e){return e.module?e.module:e.module={id:e.map.id,uri:e.map.url,config:function(){return getOwn(E.config,e.map.id)||{}},exports:e.exports||(e.exports={})}}},y=function(e){this.events=getOwn(S,e.id)||{},this.map=e,this.shim=getOwn(E.shim,e.id),this.depExports=[],this.depMaps=[],this.depMatched=[],this.pluginMaps={},this.depCount=0},y.prototype={init:function(e,t,n,r){r=r||{},this.inited||(this.factory=t,n?this.on("error",n):this.events.error&&(n=bind(this,function(e){this.emit("error",e)})),this.depMaps=e&&e.slice(0),this.errback=n,this.inited=!0,this.ignore=r.ignore,r.enabled||this.enabled?this.enable():this.check())},defineDep:function(e,t){this.depMatched[e]||(this.depMatched[e]=!0,this.depCount-=1,this.depExports[e]=t)},fetch:function(){if(!this.fetched){this.fetched=!0,x.startTime=(new Date).getTime();var e=this.map;return this.shim?void x.makeRequire(this.map,{enableBuildCallback:!0})(this.shim.deps||[],bind(this,function(){return e.prefix?this.callPlugin():this.load()})):e.prefix?this.callPlugin():this.load()}},load:function(){var e=this.map.url;_[e]||(_[e]=!0,x.load(this.map.id,e))},check:function(){if(this.enabled&&!this.enabling){var e,t,n=this.map.id,r=this.depExports,i=this.exports,o=this.factory;if(this.inited){if(this.error)this.emit("error",this.error);else if(!this.defining){if(this.defining=!0,this.depCount<1&&!this.defined){if(isFunction(o)){if(this.events.error&&this.map.isDefine||req.onError!==defaultOnError)try{i=x.execCb(n,o,r,i)}catch(t){e=t}else i=x.execCb(n,o,r,i);if(this.map.isDefine&&void 0===i&&(t=this.module,t?i=t.exports:this.usingExports&&(i=this.exports)),e)return e.requireMap=this.map,e.requireModules=this.map.isDefine?[this.map.id]:null,e.requireType=this.map.isDefine?"define":"require",u(this.error=e)}else i=o;if(this.exports=i,this.map.isDefine&&!this.ignore&&(O[n]=i,req.onResourceLoad)){var a=[];each(this.depMaps,function(e){a.push(e.normalizedMap||e)}),req.onResourceLoad(x,this.map,a)}f(n),this.defined=!0}this.defining=!1,this.defined&&!this.defineEmitted&&(this.defineEmitted=!0,this.emit("defined",this.exports),this.defineEmitComplete=!0)}}else hasProp(x.defQueueMap,n)||this.fetch()}},callPlugin:function(){var e=this.map,t=e.id,r=a(e.prefix);this.depMaps.push(r),c(r,"defined",bind(this,function(r){var i,o,d,l=getOwn(T,this.map.id),p=this.map.name,h=this.map.parentMap?this.map.parentMap.name:null,m=x.makeRequire(e.parentMap,{enableBuildCallback:!0});return this.map.unnormalized?(r.normalize&&(p=r.normalize(p,function(e){return n(e,h,!0)})||""),o=a(e.prefix+"!"+p,this.map.parentMap,!0),c(o,"defined",bind(this,function(e){this.map.normalizedMap=o,this.init([],function(){return e},null,{enabled:!0,ignore:!0})})),d=getOwn(k,o.id),void(d&&(this.depMaps.push(o),this.events.error&&d.on("error",bind(this,function(e){this.emit("error",e)})),d.enable()))):l?(this.map.url=x.nameToUrl(l),void this.load()):(i=bind(this,function(e){this.init([],function(){return e},null,{enabled:!0})}),i.error=bind(this,function(e){this.inited=!0,this.error=e,e.requireModules=[t],eachProp(k,function(e){0===e.map.id.indexOf(t+"_unnormalized")&&f(e.map.id)}),u(e)}),i.fromText=bind(this,function(n,r){var o=e.name,c=a(o),d=useInteractive;r&&(n=r),d&&(useInteractive=!1),s(c),hasProp(E.config,t)&&(E.config[o]=E.config[t]);try{req.exec(n)}catch(e){return u(makeError("fromtexteval","fromText eval for "+t+" failed: "+e,e,[t]))}d&&(useInteractive=!0),this.depMaps.push(c),x.completeLoad(o),m([o],i)}),void r.load(e.name,m,i,E))})),x.enable(r,this),this.pluginMaps[r.id]=r},enable:function(){j[this.map.id]=this,this.enabled=!0,this.enabling=!0,each(this.depMaps,bind(this,function(e,t){var n,r,i;if("string"==typeof e){if(e=a(e,this.map.isDefine?this.map:this.map.parentMap,!1,!this.skipMap),this.depMaps[t]=e,i=getOwn(q,e.id))return void(this.depExports[t]=i(this));this.depCount+=1,c(e,"defined",bind(this,function(e){this.undefed||(this.defineDep(t,e),this.check())})),this.errback?c(e,"error",bind(this,this.errback)):this.events.error&&c(e,"error",bind(this,function(e){this.emit("error",e)}))}n=e.id,r=k[n],hasProp(q,n)||!r||r.enabled||x.enable(e,this)})),eachProp(this.pluginMaps,bind(this,function(e){var t=getOwn(k,e.id);t&&!t.enabled&&x.enable(e,this)})),this.enabling=!1,this.check()},on:function(e,t){var n=this.events[e];n||(n=this.events[e]=[]),n.push(t)},emit:function(e,t){each(this.events[e],function(e){e(t)}),"error"===e&&delete this.events[e]}},x={config:E,contextName:e,registry:k,defined:O,urlFetched:_,defQueue:M,defQueueMap:{},Module:y,makeModuleMap:a,nextTick:req.nextTick,onError:u,configure:function(e){if(e.baseUrl&&"/"!==e.baseUrl.charAt(e.baseUrl.length-1)&&(e.baseUrl+="/"),"string"==typeof e.urlArgs){var t=e.urlArgs;e.urlArgs=function(e,n){return(n.indexOf("?")===-1?"?":"&")+t}}var n=E.shim,r={paths:!0,bundles:!0,config:!0,map:!0};eachProp(e,function(e,t){r[t]?(E[t]||(E[t]={}),mixin(E[t],e,!0,!0)):E[t]=e}),e.bundles&&eachProp(e.bundles,function(e,t){each(e,function(e){e!==t&&(T[e]=t)})}),e.shim&&(eachProp(e.shim,function(e,t){isArray(e)&&(e={deps:e}),!e.exports&&!e.init||e.exportsFn||(e.exportsFn=x.makeShimExports(e)),n[t]=e}),E.shim=n),e.packages&&each(e.packages,function(e){var t,n;e="string"==typeof e?{name:e}:e,n=e.name,t=e.location,t&&(E.paths[n]=e.location),E.pkgs[n]=e.name+"/"+(e.main||"main").replace(currDirRegExp,"").replace(jsSuffixRegExp,"")}),eachProp(k,function(e,t){e.inited||e.map.unnormalized||(e.map=a(t,null,!0))}),(e.deps||e.callback)&&x.require(e.deps||[],e.callback)},makeShimExports:function(e){function t(){var t;return e.init&&(t=e.init.apply(global,arguments)),t||e.exports&&getGlobal(e.exports)}return t},makeRequire:function(t,i){function o(n,r,c){var d,f,l;return i.enableBuildCallback&&r&&isFunction(r)&&(r.__requireJsBuild=!0),"string"==typeof n?isFunction(r)?u(makeError("requireargs","Invalid require call"),c):t&&hasProp(q,n)?q[n](k[t.id]):req.get?req.get(x,n,t,o):(f=a(n,t,!1,!0),d=f.id,hasProp(O,d)?O[d]:u(makeError("notloaded",'Module name "'+d+'" has not been loaded yet for context: '+e+(t?"":". Use require([])")))):(b(),x.nextTick(function(){b(),l=s(a(null,t)),l.skipMap=i.skipMap,l.init(n,r,c,{enabled:!0}),p()}),o)}return i=i||{},mixin(o,{isBrowser:isBrowser,toUrl:function(e){var r,i=e.lastIndexOf("."),o=e.split("/")[0],a="."===o||".."===o;return i!==-1&&(!a||i>1)&&(r=e.substring(i,e.length),e=e.substring(0,i)),x.nameToUrl(n(e,t&&t.id,!0),r,!0)},defined:function(e){return hasProp(O,a(e,t,!1,!0).id)},specified:function(e){return e=a(e,t,!1,!0).id,hasProp(O,e)||hasProp(k,e)}}),t||(o.undef=function(e){d();var n=a(e,t,!0),i=getOwn(k,e);i.undefed=!0,r(e),delete O[e],delete _[n.url],delete S[e],eachReverse(M,function(t,n){t[0]===e&&M.splice(n,1)}),delete x.defQueueMap[e],i&&(i.events.defined&&(S[e]=i.events),f(e))}),o},enable:function(e){var t=getOwn(k,e.id);t&&s(e).enable()},completeLoad:function(e){var t,n,r,o=getOwn(E.shim,e)||{},a=o.exports;for(d();M.length;){if(n=M.shift(),null===n[0]){if(n[0]=e,t)break;t=!0}else n[0]===e&&(t=!0);h(n)}if(x.defQueueMap={},r=getOwn(k,e),!t&&!hasProp(O,e)&&r&&!r.inited){if(!(!E.enforceDefine||a&&getGlobal(a)))return i(e)?void 0:u(makeError("nodefine","No define call for "+e,null,[e]));h([e,o.deps||[],o.exportsFn])}p()},nameToUrl:function(e,t,n){var r,i,o,a,s,c,u,d=getOwn(E.pkgs,e);if(d&&(e=d),u=getOwn(T,e))return x.nameToUrl(u,t,n);if(req.jsExtRegExp.test(e))s=e+(t||"");else{for(r=E.paths,i=e.split("/"),o=i.length;o>0;o-=1)if(a=i.slice(0,o).join("/"),c=getOwn(r,a)){isArray(c)&&(c=c[0]),i.splice(0,o,c);break}s=i.join("/"),s+=t||(/^data\:|^blob\:|\?/.test(s)||n?"":".js"),s=("/"===s.charAt(0)||s.match(/^[\w\+\.\-]+:/)?"":E.baseUrl)+s}return E.urlArgs&&!/^blob\:/.test(s)?s+E.urlArgs(e,s):s},load:function(e,t){req.load(x,e,t)},execCb:function(e,t,n,r){return t.apply(r,n)},onScriptLoad:function(e){if("load"===e.type||readyRegExp.test((e.currentTarget||e.srcElement).readyState)){interactiveScript=null;var t=g(e);x.completeLoad(t.id)}},onScriptError:function(e){var t=g(e);if(!i(t.id)){var n=[];return eachProp(k,function(e,r){0!==r.indexOf("_@r")&&each(e.depMaps,function(e){if(e.id===t.id)return n.push(r),!0})}),u(makeError("scripterror",'Script error for "'+t.id+(n.length?'", needed by: '+n.join(", "):'"'),e,[t.id]))}}},x.require=x.makeRequire(),x}function getInteractiveScript(){return interactiveScript&&"interactive"===interactiveScript.readyState?interactiveScript:(eachReverse(scripts(),function(e){if("interactive"===e.readyState)return interactiveScript=e}),interactiveScript)}var req,s,head,baseElement,dataMain,src,interactiveScript,currentlyAddingScript,mainScript,subPath,version="2.3.3",commentRegExp=/\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/gm,cjsRequireRegExp=/[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,jsSuffixRegExp=/\.js$/,currDirRegExp=/^\.\//,op=Object.prototype,ostring=op.toString,hasOwn=op.hasOwnProperty,isBrowser=!("undefined"==typeof window||"undefined"==typeof navigator||!window.document),isWebWorker=!isBrowser&&"undefined"!=typeof importScripts,readyRegExp=isBrowser&&"PLAYSTATION 3"===navigator.platform?/^complete$/:/^(complete|loaded)$/,defContextName="_",isOpera="undefined"!=typeof opera&&""+opera=="[object Opera]",contexts={},cfg={},globalDefQueue=[],useInteractive=!1;if(void 0===define){if(void 0!==requirejs){if(isFunction(requirejs))return;cfg=requirejs,requirejs=void 0}void 0===require||isFunction(require)||(cfg=require,require=void 0),req=requirejs=function(e,t,n,r){var i,o,a=defContextName;return isArray(e)||"string"==typeof e||(o=e,isArray(t)?(e=t,t=n,n=r):e=[]),o&&o.context&&(a=o.context),i=getOwn(contexts,a),i||(i=contexts[a]=req.s.newContext(a)),o&&i.configure(o),i.require(e,t,n)},req.config=function(e){return req(e)},req.nextTick=void 0!==setTimeout?function(e){setTimeout(e,4)}:function(e){e()},require||(require=req),req.version=version,req.jsExtRegExp=/^\/|:|\?|\.js$/,req.isBrowser=isBrowser,s=req.s={contexts:contexts,newContext:newContext},req({}),each(["toUrl","undef","defined","specified"],function(e){req[e]=function(){var t=contexts[defContextName];return t.require[e].apply(t,arguments)}}),isBrowser&&(head=s.head=document.getElementsByTagName("head")[0],baseElement=document.getElementsByTagName("base")[0],baseElement&&(head=s.head=baseElement.parentNode)),req.onError=defaultOnError,req.createNode=function(e,t,n){var r=e.xhtml?document.createElementNS("http://www.w3.org/1999/xhtml","html:script"):document.createElement("script");return r.type=e.scriptType||"text/javascript",r.charset="utf-8",r.async=!0,r},req.load=function(e,t,n){var r,i=e&&e.config||{};if(isBrowser)return r=req.createNode(i,t,n),r.setAttribute("data-requirecontext",e.contextName),r.setAttribute("data-requiremodule",t),!r.attachEvent||r.attachEvent.toString&&(""+r.attachEvent).indexOf("[native code")<0||isOpera?(r.addEventListener("load",e.onScriptLoad,!1),r.addEventListener("error",e.onScriptError,!1)):(useInteractive=!0,r.attachEvent("onreadystatechange",e.onScriptLoad)),r.src=n,i.onNodeCreated&&i.onNodeCreated(r,i,t,n),currentlyAddingScript=r,baseElement?head.insertBefore(r,baseElement):head.appendChild(r),currentlyAddingScript=null,r;if(isWebWorker)try{setTimeout(function(){},0),importScripts(n),e.completeLoad(t)}catch(r){e.onError(makeError("importscripts","importScripts failed for "+t+" at "+n,r,[t]))}},isBrowser&&!cfg.skipDataMain&&eachReverse(scripts(),function(e){if(head||(head=e.parentNode),dataMain=e.getAttribute("data-main"))return mainScript=dataMain,cfg.baseUrl||mainScript.indexOf("!")!==-1||(src=mainScript.split("/"),mainScript=src.pop(),subPath=src.length?src.join("/")+"/":"./",cfg.baseUrl=subPath),mainScript=mainScript.replace(jsSuffixRegExp,""),req.jsExtRegExp.test(mainScript)&&(mainScript=dataMain),cfg.deps=cfg.deps?cfg.deps.concat(mainScript):[mainScript],!0}),define=function(e,t,n){var r,i;"string"!=typeof e&&(n=t,t=e,e=null),isArray(t)||(n=t,t=null),!t&&isFunction(n)&&(t=[],n.length&&((""+n).replace(commentRegExp,commentReplace).replace(cjsRequireRegExp,function(e,n){t.push(n)}),t=(1===n.length?["require"]:["require","exports","module"]).concat(t))),useInteractive&&(r=currentlyAddingScript||getInteractiveScript(),r&&(e||(e=r.getAttribute("data-requiremodule")),i=contexts[r.getAttribute("data-requirecontext")])),i?(i.defQueue.push([e,t,n]),i.defQueueMap[e]=!0):globalDefQueue.push([e,t,n])},define.amd={jQuery:!0},req.exec=function(text){return eval(text)},req(cfg)}}(this,"undefined"==typeof setTimeout?void 0:setTimeout),function(e,t,n){t[e]=t[e]||n(),"undefined"!=typeof module&&module.exports?module.exports=t[e]:"function"==typeof define&&define.amd&&define("../node_modules/native-promise-only/lib/npo.src",[],function(){return t[e]})}("Promise","undefined"!=typeof global?global:this,function(){"use strict";function e(e,t){l.add(e,t),f||(f=h(l.drain))}function t(e){var t,n=typeof e;return null==e||"object"!=n&&"function"!=n||(t=e.then),"function"==typeof t&&t}function n(){for(var e=0;e<this.chain.length;e++)r(this,1===this.state?this.chain[e].success:this.chain[e].failure,this.chain[e]);this.chain.length=0}function r(e,n,r){var i,o;try{n===!1?r.reject(e.msg):(i=n===!0?e.msg:n.call(void 0,e.msg),i===r.promise?r.reject(TypeError("Promise-chain cycle")):(o=t(i))?o.call(i,r.resolve,r.reject):r.resolve(i))}catch(e){r.reject(e)}}function i(r){var a,c=this;if(!c.triggered){c.triggered=!0,c.def&&(c=c.def);try{(a=t(r))?e(function(){var e=new s(c);try{a.call(r,function(){i.apply(e,arguments)},function(){o.apply(e,arguments)})}catch(t){o.call(e,t)}}):(c.msg=r,c.state=1,c.chain.length>0&&e(n,c))}catch(e){o.call(new s(c),e)}}}function o(t){var r=this;r.triggered||(r.triggered=!0,r.def&&(r=r.def),r.msg=t,r.state=2,r.chain.length>0&&e(n,r))}function a(e,t,n,r){for(var i=0;i<t.length;i++)!function(i){e.resolve(t[i]).then(function(e){n(i,e)},r)}(i)}function s(e){this.def=e,this.triggered=!1}function c(e){this.promise=e,this.state=0,this.triggered=!1,this.chain=[],this.msg=void 0}function u(t){if("function"!=typeof t)throw TypeError("Not a function");if(0!==this.__NPO__)throw TypeError("Not a promise");this.__NPO__=1;var r=new c(this);this.then=function(t,i){var o={success:"function"!=typeof t||t,failure:"function"==typeof i&&i};return o.promise=new this.constructor(function(e,t){if("function"!=typeof e||"function"!=typeof t)throw TypeError("Not a function");o.resolve=e,o.reject=t}),r.chain.push(o),0!==r.state&&e(n,r),o.promise},this.catch=function(e){return this.then(void 0,e)};try{t.call(void 0,function(e){i.call(r,e)},function(e){o.call(r,e)})}catch(e){o.call(r,e)}}var d,f,l,p=Object.prototype.toString,h="undefined"!=typeof setImmediate?function(e){return setImmediate(e)}:setTimeout;try{Object.defineProperty({},"x",{}),d=function(e,t,n,r){return Object.defineProperty(e,t,{value:n,writable:!0,configurable:r!==!1})}}catch(e){d=function(e,t,n){return e[t]=n,e}}l=function(){function e(e,t){this.fn=e,this.self=t,this.next=void 0}var t,n,r;return{add:function(i,o){r=new e(i,o),n?n.next=r:t=r,n=r,r=void 0},drain:function(){var e=t;for(t=n=f=void 0;e;)e.fn.call(e.self),e=e.next}}}();var m=d({},"constructor",u,!1);return u.prototype=m,d(m,"__NPO__",0,!1),d(u,"resolve",function(e){var t=this;return e&&"object"==typeof e&&1===e.__NPO__?e:new t(function(t,n){if("function"!=typeof t||"function"!=typeof n)throw TypeError("Not a function");t(e)})}),d(u,"reject",function(e){return new this(function(t,n){if("function"!=typeof t||"function"!=typeof n)throw TypeError("Not a function");n(e)})}),d(u,"all",function(e){var t=this;return"[object Array]"!=p.call(e)?t.reject(TypeError("Not an array")):0===e.length?t.resolve([]):new t(function(n,r){if("function"!=typeof n||"function"!=typeof r)throw TypeError("Not a function");var i=e.length,o=Array(i),s=0;a(t,e,function(e,t){o[e]=t,++s===i&&n(o)},r)})}),d(u,"race",function(e){var t=this;return"[object Array]"!=p.call(e)?t.reject(TypeError("Not an array")):new t(function(n,r){if("function"!=typeof n||"function"!=typeof r)throw TypeError("Not a function");a(t,e,function(e,t){n(t)},r)})}),u}),require.config({waitSeconds:0,paths:{jquery:"../../../node_modules/jquery/dist/jquery",modernizr:"lib/modernizr-custom",backbone:"../../../node_modules/backbone/backbone","backbone-marionette":"../../../node_modules/backbone.marionette/lib/core/amd/backbone.marionette","backbone.wreqr":"../../../node_modules/backbone.wreqr/lib/backbone.wreqr","backbone.babysitter":"../../../node_modules/backbone.babysitter/lib/backbone.babysitter",underscore:"../../../node_modules/underscore/underscore",react:"../../../node_modules/react/dist/react","react-dom":"../../../node_modules/react-dom/dist/react-dom",handlebars:"../../../node_modules/handlebars/dist/handlebars.runtime","jquery.slick":"../../../node_modules/slick-carousel/slick/slick",loglevel:"../../../node_modules/loglevel/dist/loglevel",moment:"../../../node_modules/moment/moment",raven:"../../../node_modules/raven-js/dist/raven.min","jquery.trunk8":"vendor/jquery/jquery.trunk8","jquery.fitvids":"vendor/jquery/jquery.fitvids",bootstrap:"../../../node_modules/bootstrap/js",core:"../../../next-core/core","core/config":"core/config","core/templates":"templates/next-core","core/views/react":"core/views/react","disqus.sdk":"https://c.disquscdn.com/next/current/embed/sdk","remote/config":"https://disqus.com/next/config",translations:"empty:",home:"."},shim:{modernizr:{exports:"Modernizr"},underscore:{exports:"_"},handlebars:{exports:"Handlebars"},"jquery.trunk8":{deps:["jquery"]},"jquery.fitvids":{deps:["jquery"]},"remote/config":{exports:"DISQUS.config"},"bootstrap/dropdown":{deps:["jquery"]},"bootstrap/tooltip":{deps:["jquery"]},"bootstrap/modal":{deps:["jquery"]},"bootstrap/collapse":{deps:["jquery"]}}}),function(){"use strict";window.IS_DEV=!1;var e=window.document,t=e.location.search.substr(1).split("&").reduce(function(e,t){var n=t.split("=").map(decodeURIComponent);return n[0]&&(e[n[0]]=n[1]),e},{}),n=t.l;n&&"en"!==n&&(e.documentElement.lang=n);var r={ar:1,ar_SA:1,he:1,he_IL:1,nqo:1,fa:1,fa_IR:1,ur:1,ur_PK:1},i=function(t){var n=e.createElement("link");n.rel="stylesheet",n.href="//c.disquscdn.com/next/00b7a06/home/css/"+t+".css",e.head.appendChild(n)},o="main";r[n]&&(e.documentElement.dir="rtl",o+="_rtl"),i(o),i("hovercards");var a=e.body,s=e.getElementById("unsupportedBrowser");if(!e.addEventListener)return void(a.innerHTML="<p>"+s.innerHTML+"</p>");var c=function(){try{return window.self!==window.top}catch(e){return!0}};c()&&a.setAttribute("class",a.className+" home-drawer"),define("initializer",["require","exports"],function(t,n){n.ready=!1,n.setReady=function(){t(["common/bus"],function(e){e.sendHostMessage("ready"),n.ready=!0})},n.init=function(){function n(){t(["home/main","loglevel","raven"],function(t,n,r){var i=window.IS_DEV?"DEBUG":"SILENT";n.setDefaultLevel(i);var o=e.documentMode&&e.documentMode<10;window.IS_DEV||o||r.config("//026e773bf1524b4481b96350d4f8b7f8@sentry.services.disqus.com/33",{whitelistUrls:[s,"//c.disquscdn.com/next/current/home"],ignoreErrors:[/\bTiApp\b/],release:"00b7a06"}).install(),t.init({CDN_ROOT:s})})}function r(e,n){require.undef(e),define(e,n),t([e])}function i(e){"undefined"!=typeof console&&"function"==typeof console.log&&console.log(""+e);for(var t,n,i=e.requireModules||[],o=0;o<i.length;++o)t=i[o],n=c[t],n&&r(t,n)}var o=e.documentElement.lang,a={baseUrl:"//c.disquscdn.com/next/00b7a06/home/js",paths:{translations:"../lang/"+o}};window.IS_DEV||(a.bundles={"home/main":["moment"]}),o&&"en"!==o||define("translations",{});var s="//c.disquscdn.com/next/00b7a06/home",c={translations:{},"remote/config":{lounge:{},discovery:{},experiments:{}}};require.config(a),t(["home/main","translations"],n,i)}}),require(["initializer"],function(e){e.init()})}();
//# sourceMappingURL=initializer.js.map