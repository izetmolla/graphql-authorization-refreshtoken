import { ApolloProvider, useMutation, useQuery } from "@apollo/client";
import client from "./graphql";
import { LOGIN } from "./graphql/mutations";
import { ME } from "./graphql/queries";

function Main() {
  const { data, loading, refetch } = useQuery(ME, {
    notifyOnNetworkStatusChange: true,
  });

  const [login] = useMutation(LOGIN, {
    onError: (err) => {
      console.log(err);
      // setFieldError('username', err.message);
    },
    onCompleted: (data) => {
      if (data.login) {
        localStorage.setItem("access_token", data.login.access_token);
        localStorage.setItem("refresh_token", data.login.refresh_token);
        window.location.reload();
      }
    },
  });

  if (loading) return <p>Loading...</p>;
  console.log(data);
  return localStorage.getItem("access_token") ? (
    <div>
      <button
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
      >
        Logout
      </button>
      <br />
      <br />
      <br />
      <br />
      <button onClick={() => refetch()}>Get Data</button>
    </div>
  ) : (
    <div className="App">
      <button
        onClick={() =>
          login({
            variables: { email: "user", password: "user" },
          })
        }
      >
        Login
      </button>
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <Main />
    </ApolloProvider>
  );
}

export default App;
