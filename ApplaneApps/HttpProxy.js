var httpProxy = require("http-proxy");

var proxyTable = {};

proxyTable['porting.business.applane.com'] = '127.0.0.1:5300';
proxyTable['beta.business.applane.com'] = '127.0.0.1:5100';
proxyTable['beta1.business.applane.com'] = '127.0.0.1:5100';
proxyTable['beta2.business.applane.com'] = '127.0.0.1:5100';
proxyTable['beta3.business.applane.com'] = '127.0.0.1:5100';
proxyTable['beta4.business.applane.com'] = '127.0.0.1:5100';
proxyTable['beta5.business.applane.com'] = '127.0.0.1:5100';
proxyTable['business.applane.com'] = '127.0.0.1:5200';
proxyTable['daffodilsw.applane.com'] = '127.0.0.1:5200';
proxyTable['darcl.applane.com'] = '127.0.0.1:5200';
proxyTable['education.applane.com'] = '127.0.0.1:5200';
proxyTable['girnarsoft.applane.com'] = '127.0.0.1:5200';
proxyTable['konnectv.applane.com'] = '127.0.0.1:5200';
proxyTable['mahalakshmi.applane.com'] = '127.0.0.1:5200';
proxyTable['navigant.applane.com'] = '127.0.0.1:5200';
proxyTable['nseit.applane.com'] = '127.0.0.1:5200';
proxyTable['samples.applane.com'] = '127.0.0.1:5200';
proxyTable['sandbox.business.applane.com'] = '127.0.0.1:5200';
proxyTable['sandbox.daffodilsw.applane.com'] = '127.0.0.1:5200';
proxyTable['sandbox.konnectv.applane.com'] = '127.0.0.1:5200';
proxyTable['sandbox.mahalakshmi.applane.com'] = '127.0.0.1:5200';
proxyTable['sandbox.nseit.applane.com'] = '127.0.0.1:5200';
//*****************************fimbre*********************************
proxyTable['fimbre.applane.com'] = '127.0.0.1:5400';
//*****************************differentearth*********************************
proxyTable['differentearth.com'] = '127.0.0.1:5911';
proxyTable['www.differentearth.com'] = '127.0.0.1:5911';
proxyTable['m.differentearth.com'] = '127.0.0.1:5912';
proxyTable['.*'] = '127.0.0.1:5200';

var httpOptions = {
    router: proxyTable
};
httpProxy.createServer(httpOptions).listen(80);
console.log("proxy server running on default port 80");
