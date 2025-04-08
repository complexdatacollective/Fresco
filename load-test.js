import { check, group, sleep } from 'k6';
import http, { CookieJar } from 'k6/http';

const HOST = 'host.docker.internal:3000';

export let options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp-up to 150 users over 30 seconds.
    { duration: '1m', target: 100 }, // Stay at 150 users for 1 minute.
    { duration: '30s', target: 0 }, // Ramp down to 0 users over 10 seconds.
  ],
};

export default function () {
  let loginRes = login();
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  if (loginRes.status === 200) {
    let jar = new CookieJar();
    jar.set(
      `http://${HOST}`,
      'auth_session',
      loginRes.cookies['auth_session'][0].value,
    );

    group('Authenticated requests', function () {
      let res = http.get(`http://${HOST}/dashboard`, {
        cookies: jar.cookiesForURL(`http://${HOST}`),
      });
      check(res, {
        'is status 200': (r) => r.status === 200,
      });

      let res2 = http.get(`http://${HOST}/dashboard/settings`, {
        cookies: jar.cookiesForURL(`http://${HOST}`),
      });
      check(res2, {
        'is status 200': (r) => r.status === 200,
      });
    });
  }

  sleep(1);
}

function login() {
  let payload = '[{"username":"admin","password":"Administrator1!"}]';

  let params = {
    headers: {
      'Next-Action': '36b840346a44c93083679ff0264912dba5c1443f', // No way to get this automatically, I don't think...
      'Content-Type': 'text/plain;charset=UTF-8',
    },
  };

  return http.post(`http://${HOST}/signin`, payload, params);
}
