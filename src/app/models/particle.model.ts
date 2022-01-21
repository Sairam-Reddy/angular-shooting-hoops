import { Vector } from './vector.model';

// A Particle
export class Particle {
  public position: Vector;
  public velocity: Vector;
  public gravity: Vector;

  public constructor() {}

  public static create(x, y, speed, direction, grav): Particle {
    const obj = new Particle();
    obj.position = Vector.create(x, y);
    obj.velocity = Vector.create(0, 0);
    obj.velocity.setLength(speed);
    obj.velocity.setAngle(direction);
    obj.gravity = Vector.create(0, grav ? grav : 0);

    return obj;
  }

  public accelerate(vector: Vector) {
    this.velocity = this.velocity.add(vector);
  }

  public update(): void {
    this.velocity = this.velocity.add(this.gravity);
    this.position = this.position.add(this.velocity);
  }
}
