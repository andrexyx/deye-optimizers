const assert = require("node:assert/strict");
const helper = require("../tools/token-assistant.js");

const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiZGV5ZSJ9.signature123456789";
assert.equal(helper.tokenFrom(`curl 'https://www.deyecloud.com/maintain-s/operating/station/12345/common' -H 'Authorization: Bearer ${jwt}'`), jwt);
assert.deepEqual(helper.stationsFrom("https://www.deyecloud.com/maintain-s/operating/station/12345/common"), [{id:"12345",name:"Station 12345"}]);
assert.deepEqual(helper.stationsFrom(JSON.stringify({data:[{stationId:77,stationName:"Home"}]})), [{id:"77",name:"Home"}]);
assert.equal(helper.tokenFrom('{"access_token":"0123456789abcdef0123456789abcdef"}'), "0123456789abcdef0123456789abcdef");
assert.equal(helper.tokenFrom("nothing sensitive"), "");
console.log("Token Assistant tests passed");
