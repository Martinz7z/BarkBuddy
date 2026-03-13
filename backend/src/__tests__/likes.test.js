import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("Dog Likes", () => {
  let token;
  let dogId;

  test("login basic user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "user_test@example.com",
        password: "Password123!",
      });

    token = res.body.token;
    expect(res.statusCode).toBe(200);
  });

  test("get dogs", async () => {
    const res = await request(app).get("/dogs");

    dogId = res.body.dogs[0].id;

    expect(res.statusCode).toBe(200);
    expect(res.body.dogs.length).toBeGreaterThan(0);
  });

  test("like a dog", async () => {
    const res = await request(app)
      .post(`/dogs/${dogId}/like`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(res.statusCode);
  });
});