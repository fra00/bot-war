import { describe, it, expect } from "vitest";
import {
  circleIntersectsRectangle,
  lineSegmentIntersectsRectangle,
  distSqPointToLineSegment,
  projectileIntersectsObstacle,
} from "../game/geometryHelpers/index.js";

describe("Geometry Helpers", () => {
  describe("circleIntersectsRectangle", () => {
    const rect = { x: 10, y: 10, width: 20, height: 20 }; // Rettangolo da 10,10 a 30,30

    it("should return true when circle is completely inside", () => {
      const circle = { x: 20, y: 20, radius: 5 };
      expect(circleIntersectsRectangle(circle, rect)).toBe(true);
    });

    it("should return true when circle overlaps an edge", () => {
      const circle = { x: 5, y: 20, radius: 6 }; // Tocca il lato sinistro
      expect(circleIntersectsRectangle(circle, rect)).toBe(true);
    });

    it("should return true when circle overlaps a corner", () => {
      const circle = { x: 5, y: 5, radius: 8 }; // Tocca l'angolo in alto a sinistra
      expect(circleIntersectsRectangle(circle, rect)).toBe(true);
    });

    it("should return true when rectangle is inside the circle", () => {
      const circle = { x: 20, y: 20, radius: 30 };
      expect(circleIntersectsRectangle(circle, rect)).toBe(true);
    });

    it("should return false when circle is outside and not touching", () => {
      const circle = { x: 50, y: 50, radius: 5 };
      expect(circleIntersectsRectangle(circle, rect)).toBe(false);
    });

    it("should return false when circle is just touching an edge", () => {
      // La collisione è < r*r, quindi il tocco non conta
      const circle = { x: 5, y: 20, radius: 5 };
      expect(circleIntersectsRectangle(circle, rect)).toBe(false);
    });

    it("should return false when circle is just touching a corner", () => {
      const circle = { x: 5, y: 5, radius: Math.sqrt(5 * 5 + 5 * 5) };
      expect(circleIntersectsRectangle(circle, rect)).toBe(false);
    });
  });

  describe("lineSegmentIntersectsRectangle", () => {
    const rect = { x: 10, y: 10, width: 20, height: 20 }; // Rettangolo da 10,10 a 30,30

    it("should return true for a segment crossing the rectangle", () => {
      const p1 = { x: 0, y: 20 };
      const p2 = { x: 40, y: 20 };
      expect(lineSegmentIntersectsRectangle(p1, p2, rect)).toBe(true);
    });

    it("should return true for a diagonal segment crossing", () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 40, y: 40 };
      expect(lineSegmentIntersectsRectangle(p1, p2, rect)).toBe(true);
    });

    it("should return true when one point is inside", () => {
      const p1 = { x: 15, y: 15 };
      const p2 = { x: 50, y: 50 };
      expect(lineSegmentIntersectsRectangle(p1, p2, rect)).toBe(true);
    });

    it("should return true when both points are inside", () => {
      const p1 = { x: 15, y: 15 };
      const p2 = { x: 25, y: 25 };
      expect(lineSegmentIntersectsRectangle(p1, p2, rect)).toBe(true);
    });

    it("should return false for a segment completely outside", () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 5, y: 40 };
      expect(lineSegmentIntersectsRectangle(p1, p2, rect)).toBe(false);
    });

    it("should return true for a segment touching an edge", () => {
      const p1 = { x: 0, y: 10 };
      const p2 = { x: 20, y: 10 };
      expect(lineSegmentIntersectsRectangle(p1, p2, rect)).toBe(true);
    });

    it("should return false for a collinear segment not overlapping", () => {
      const p1 = { x: 35, y: 20 };
      const p2 = { x: 50, y: 20 };
      expect(lineSegmentIntersectsRectangle(p1, p2, rect)).toBe(false);
    });
  });

  describe("distSqPointToLineSegment", () => {
    const p1 = { x: 10, y: 10 };
    const p2 = { x: 30, y: 10 };

    it("should return 0 if point is on the segment", () => {
      const point = { x: 20, y: 10 };
      expect(distSqPointToLineSegment(point, p1, p2)).toBe(0);
    });

    it("should calculate distance to the closest point on the segment", () => {
      const point = { x: 20, y: 20 }; // Proiezione è (20, 10), distanza è 10
      expect(distSqPointToLineSegment(point, p1, p2)).toBe(100); // 10*10
    });

    it("should calculate distance to p1 if projection is outside", () => {
      const point = { x: 0, y: 20 }; // Proiezione è (0, 10), più vicino a p1
      const distSq = (0 - 10) ** 2 + (20 - 10) ** 2; // 100 + 100 = 200
      expect(distSqPointToLineSegment(point, p1, p2)).toBe(distSq);
    });

    it("should calculate distance to p2 if projection is outside", () => {
      const point = { x: 40, y: 20 }; // Proiezione è (40, 10), più vicino a p2
      const distSq = (40 - 30) ** 2 + (20 - 10) ** 2; // 100 + 100 = 200
      expect(distSqPointToLineSegment(point, p1, p2)).toBe(distSq);
    });

    it("should handle the case where p1 and p2 are the same", () => {
      const point = { x: 20, y: 20 };
      const p_same = { x: 10, y: 10 };
      const distSq = (20 - 10) ** 2 + (20 - 10) ** 2; // 100 + 100 = 200
      expect(distSqPointToLineSegment(point, p_same, p_same)).toBe(distSq);
    });
  });

  describe("projectileIntersectsObstacle", () => {
    const obstacle = { x: 40, y: 40, width: 20, height: 20 }; // da 40,40 a 60,60
    const radius = 10;

    it("should return true if projectile starts inside the obstacle", () => {
      const start = { x: 45, y: 45 };
      const end = { x: 100, y: 100 };
      expect(projectileIntersectsObstacle(start, end, radius, obstacle)).toBe(
        true
      );
    });

    it("should return true if projectile ends inside the obstacle", () => {
      const start = { x: 0, y: 0 };
      const end = { x: 55, y: 55 };
      expect(projectileIntersectsObstacle(start, end, radius, obstacle)).toBe(
        true
      );
    });

    it("should return true if path goes through the obstacle", () => {
      const start = { x: 0, y: 50 };
      const end = { x: 100, y: 50 };
      // Il proiettile passa attraverso il centro dell'ostacolo
      expect(projectileIntersectsObstacle(start, end, radius, obstacle)).toBe(
        true
      );
    });

    it("should return true if projectile grazes the obstacle due to its radius", () => {
      const start = { x: 0, y: 35 };
      const end = { x: 100, y: 35 };
      // Il centro del proiettile passa a y=35. L'ostacolo inizia a y=40.
      // La distanza è 5, che è < del raggio 10. Quindi c'è collisione.
      expect(projectileIntersectsObstacle(start, end, radius, obstacle)).toBe(
        true
      );
    });

    it("should return false for a near miss", () => {
      const start = { x: 0, y: 29 };
      const end = { x: 100, y: 29 };
      // Il centro del proiettile passa a y=29. L'ostacolo inizia a y=40.
      // La distanza è 11, che è > del raggio 10. Nessuna collisione.
      expect(projectileIntersectsObstacle(start, end, radius, obstacle)).toBe(
        false
      );
    });

    it("should return true for a diagonal path that clips a corner", () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 100 };
      const cornerObstacle = { x: 35, y: 45, width: 10, height: 10 };
      // Il proiettile (y=x) passa vicino all'angolo (35, 55) dell'ostacolo.
      // L'expandedRect è {x:25, y:35, w:30, h:30}.
      // La linea y=x interseca questo rettangolo.
      expect(
        projectileIntersectsObstacle(start, end, radius, cornerObstacle)
      ).toBe(true);
    });

    it("should return false for a diagonal path that misses a corner", () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 100 };
      const cornerObstacle = { x: 20, y: 80, width: 10, height: 10 };
      // L'ostacolo è lontano dalla traiettoria y=x
      expect(
        projectileIntersectsObstacle(start, end, radius, cornerObstacle)
      ).toBe(false);
    });

    it("should return false when path is parallel and far away", () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 0 };
      // L'ostacolo è a y=40, il proiettile a y=0. Distanza 40. Raggio 10.
      expect(projectileIntersectsObstacle(start, end, radius, obstacle)).toBe(
        false
      );
    });
  });
});
