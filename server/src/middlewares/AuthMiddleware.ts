import { AuthenticationError } from "apollo-server-express";
import jwt from "jsonwebtoken";
function getBearerToken(token: any) {
  return token && token.split("Bearer ").pop();
}

const AuthMiddleware = (req: any, res: any, next: any) => {
  const token = getBearerToken(req.headers.authorization);
  if (token) {
    jwt.verify(
      token,
      "f1BtnWgD3VKY",
      {
        algorithms: ["HS256"],
      },
      (err: any, payload: any) => {
        if (err) {
          const message =
            err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
          req.auth = message;
          req.user = undefined;
          if (message === "jwt expired") {
            //   console.log("Jwt Expired");
            req.user = undefined;
            req.auth = message;
            next();
          } else {
            req.user = undefined;
            req.auth = message;
            console.log("unauthorizated");
            next();
          }
        } else {
          // console.log(payload);
          req.user = payload;
          req.auth = undefined;
          next();
        }
      }
    );
  } else {
    req.user = undefined;
    next();
  }
};

const verifyRefreshToken = async (token: any) => {
  return new Promise((resolve, reject) => {
    return jwt.verify(token, "123", (err: any, payload: any) => {
      if (err) return reject(err);
      return resolve({
        access_token: jwt.sign(
          {
            "https://awesomeapi.com/graphql":
              payload["https://awesomeapi.com/graphql"],
          },
          "f1BtnWgD3VKY",
          { algorithm: "HS256", subject: payload["sub"], expiresIn: "15s" }
        ),
        refresh_token: token,
      });
      // return RefreshToken.findOne({ attributes: ["token"], where: { token } })
      // .then((res: any) => {
      //   if (res) {
      //     if (token === res.token) return resolve(payload.aud);
      //   } else {
      //     return reject(new AuthenticationError("Unauthorized"));
      //   }
      // })
      // // .catch((err) => {
      //   if (err) {
      //     return reject(new AuthenticationError("Unauthorized"));
      //   }
      // });
    });
  });
};

export { AuthMiddleware, verifyRefreshToken };
