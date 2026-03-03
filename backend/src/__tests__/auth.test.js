import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

function uniqueEmail() {
  return `test_${Date.now()}@example.com`;
}

describe("Auth", () => {
  it("registers a user and returns token + user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        name: "Test User",
        email: uniqueEmail(),
        password: "Password123!",
        role: "BASIC_USER",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toBeTruthy();
    expect(res.body.user.email).toBeTruthy();
  });

  it("logs in and returns token + user", async () => {
    const email = uniqueEmail();

    await request(app)
      .post("/auth/register")
      .send({
        name: "Login User",
        email,
        password: "Password123!",
        role: "BASIC_USER",
      });

    const res = await request(app)
      .post("/auth/login")
      .send({ email, password: "Password123!" });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toBeTruthy();
    expect(res.body.user.email).toBe(email);
  });

  it("me returns current user when token is valid", async () => {
    const email = uniqueEmail();

    const reg = await request(app)
      .post("/auth/register")
      .send({
        name: "Me User",
        email,
        password: "Password123!",
        role: "BASIC_USER",
      });

    const token = reg.body.token;

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeTruthy();
    expect(res.body.user.email).toBe(email);
  });
});