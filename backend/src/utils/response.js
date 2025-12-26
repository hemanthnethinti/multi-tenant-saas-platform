exports.success = (res, data = null, message = null, status = 200) => {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null) body.data = data;
  return res.status(status).json(body);
};

exports.error = (res, status = 400, message = "Error") => {
  return res.status(status).json({ success: false, message });
};
