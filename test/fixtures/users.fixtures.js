function makeUsersArray() {
  return [
    {
      id: 1,
      name: 'Jared Keeso',
      email: 'jared@letterkenny.com',
      password: 'password123',
      user_role: 3,
      team_id: 1,
      date_created: '2020-03-13 01:29:01'
    },
    {
      id: 2,
      name: 'Nathan Dales',
      email: 'nathan@letterkenny.com',
      password: 'password123',
      user_role: 2,
      team_id: 1,
      date_created: '2020-03-13 01:29:01'
    },
    {
      id: 3,
      name: 'Dan Petronijevic',
      email: 'dan@letterkenny.com',
      password: 'password123',
      user_role: 1,
      team_id: 1,
      date_created: '2020-03-13 01:29:01'
    }
  ];
}

module.exports = { makeUsersArray };
