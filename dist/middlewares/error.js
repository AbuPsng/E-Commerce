export const errorMiddleware = (err, req, res, next) => {
    err.message || (err.message = "Internal server error");
    err.statusCode || (err.statusCode = 500);
    if (err.name === "CastError")
        err.message = "Invalid ID";
    if (err.name === "MongoServerError")
        err.message =
            "This name is already being used. Please enter different name";
    console.log(err);
    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};
export const TryCatch = (func) => {
    return async (req, res, next) => {
        try {
            return await func(req, res, next);
        }
        catch (error) {
            return next(error);
        }
    };
};
