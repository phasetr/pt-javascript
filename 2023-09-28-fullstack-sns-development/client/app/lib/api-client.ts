import { Axios } from "axios";

const apiClient = new Axios({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  }
});

export default apiClient;
