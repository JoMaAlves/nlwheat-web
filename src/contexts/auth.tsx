import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
}

type AuthResponse = {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  }
}

type AuthProvider = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider(props: AuthProvider) {
  const [user, setUser] = useState<User | null>(null);

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=c9736830d1f56efa2a30`;

  async function signIn(githubCode: string){
    const response = await api.post<AuthResponse>('authenticate', {
      code: githubCode
    });

    const data = response.data;

    localStorage.setItem('@dowhile:token', data.token);

    api.defaults.headers.common.authorization = `Bearer ${data.token}`;

    setUser(data.user);
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('@dowhile:token');
  }

  useEffect(() => {
    const token = localStorage.getItem('@dowhile:token');

    if(token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`;
      
      api.get<User>('profile').then(response => {
        setUser(response.data);
      })
    }
  },[])

  useEffect(()=> {
    const url = window.location.href;
    const hasGithubCode = url.includes('?code=');

    if (hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split('?code=')

      window.history.pushState({},'', urlWithoutCode);

      signIn(githubCode)
    }
  },[]);

  return (
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      { props.children }
    </AuthContext.Provider>
  )
}