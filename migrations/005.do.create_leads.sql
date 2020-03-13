CREATE TABLE leads (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  name TEXT NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  cold_caller INTEGER
    REFERENCES users(id) ON DELETE SET NULL,
  assigned_to INTEGER
    REFERENCES users(id) ON DELETE SET NULL,
  date_created TIMESTAMP NOT NULL DEFAULT now(),
  last_updated TIMESTAMP NOT NULL DEFAULT now(),
  pipeline_id INTEGER
    REFERENCES pipelines(id) ON DELETE SET NULL
);