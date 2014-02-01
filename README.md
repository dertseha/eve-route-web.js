[![Dependency Status][depstat-image]][depstat-url]

## EVE-Route-Web.js

The web runner for eve-route.js.

### Route finding via JSON requests

The URL ```<server>/route/find``` accepts a POST with application/json that follows the schema of ```src/schema/RouteRequest.json```. If successfull, the result will be an application/json response following the schema of ```src/schema/RouteResponse.json```.

#### Example
```text
curl -v --data-binary @test/requests/BogelekToSotrenzurAvoidingDot2.json --header "ontent-Type: application/json" http://127.0.0.1:3000/route/find
* Hostname was NOT found in DNS cache
*   Trying 127.0.0.1...
* Adding handle: conn: 0xb4c7a0
* Adding handle: send: 0
* Adding handle: recv: 0
* Curl_addHandleToPipeline: length: 1
* - Conn 0 (0xb4c7a0) send_pipe: 1, recv_pipe: 0
* Connected to 127.0.0.1 (127.0.0.1) port 3000 (#0)
> POST /route/find HTTP/1.1
> User-Agent: curl/7.34.0
> Host: 127.0.0.1:3000
> Accept: */*
> Content-Type: application/json
> Content-Length: 301
>
* upload completely sent off: 301 out of 301 bytes
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Content-Type: application/json; charset=utf-8
< Content-Length: 233
< Set-Cookie: connect.sid=s%3A2kw5kZfG_HbJ4Ja0j08Xg8Sf.hwyxg49h1UdFmFBGlDfxy%2FT1X18wAxeVI2%2BPcL4UKl8; Path=/; HttpOnly
< Date: Sat, 01 Feb 2014 19:17:07 GMT
< Connection: keep-alive
<
{
  "path": [
    {
      "solarSystem": 30002553
    },
    {
      "solarSystem": 30002551
    },
    {
      "solarSystem": 30002550
    },
    {
      "solarSystem": 30002574
    },
    {
      "solarSystem": 30002575
    }
  ]
}
* Connection #0 to host 127.0.0.1 left intact
```

## License

The project is available under the terms of the **New BSD License** (see LICENSE file).

[depstat-url]: https://david-dm.org/dertseha/eve-route-web.js
[depstat-image]: https://david-dm.org/dertseha/eve-route-web.js.png?theme=shields.io
