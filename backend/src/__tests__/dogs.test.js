import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../prisma.js";

const app = createApp();

function uniqueEmail() {
  return `shelter_${Date.now()}@example.com`;
}

describe("Dogs", () => {
  let token = "";
  let dogId = "";

  beforeAll(async () => {
    const reg = await request(app)
      .post("/auth/register")
      .send({
        name: "Test Shelter",
        email: uniqueEmail(),
        password: "Password123!",
        role: "SHELTER",
        shelterName: "Demo Shelter",
      });

    token = reg.body.token;
  });

  afterAll(async () => {
    // clean up dog if created (keeps Supabase tidy)
    if (dogId) {
      await prisma.dog.delete({ where: { id: dogId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("creates a dog (SHELTER only)", async () => {
    const res = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Rex",
        breed: "German Shepherd",
        description: "Friendly and active",
        ageCategory: "ADULT",
        sizeCategory: "LARGE",
        imageUrl: "https://images.unsplash.com/photo-1558788353-f76d92427f16",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.dog).toBeTruthy();
    expect(res.body.dog.name).toBe("Rex");

    dogId = res.body.dog.id;
  });

  it("lists dogs (public)", async () => {
    const res = await request(app).get("/dogs");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.dogs)).toBe(true);
  });

  it("lists my dogs (SHELTER only)", async () => {
    const res = await request(app)
      .get("/dogs/mine")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.dogs)).toBe(true);
  });
});