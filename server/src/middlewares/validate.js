export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(
    { body: req.body, query: req.query, params: req.params },
    { abortEarly: false, allowUnknown: true }
  );
  if (error) {
    return res.status(422).json({ errors: error.details.map(d => d.message) });
  }
  req.validated = value;
  next();
};
