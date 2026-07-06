const { constants } = require('../constants');

test('constants have expected HTTP codes', () => {
  expect(constants.VALIDATION_ERROR).toBe(400);
  expect(constants.UNAUTHORIZED).toBe(401);
  expect(constants.FORBIDDEN).toBe(403);
  expect(constants.NOT_FOUND).toBe(404);
  expect(constants.SERVER_ERROR).toBe(500);
});
