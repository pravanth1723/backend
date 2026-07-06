const router = require('../routes/user');

test('user router defines expected routes', () => {
  const routes = router.stack
    .filter(layer => layer.route)
    .map(layer => {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods).sort();
      return { path, methods };
    });

  const paths = routes.map(r => r.path);
  expect(paths).toEqual(expect.arrayContaining([
    '/register',
    '/login',
    '/current',
    '/me',
    '/logout',
    '/income',
    '/incomes',
    '/income/:id',
    '/methods',
    '/methods/:id',
    '/income/:fromDate/:toDate',
    '/spends/:fromDate/:toDate'
  ]));
});
