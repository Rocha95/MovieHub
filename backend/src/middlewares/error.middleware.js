function errorMiddleware(err, req, res, next) {
  console.error(err);

  return res.status(err.statusCode || err.status || 500).json({
    success: false,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Erro interno do servidor.',
  });
}

module.exports = errorMiddleware;
