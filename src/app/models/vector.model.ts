// A Vector
export class Vector {
  public _x: number;
  public _y: number;

  public constructor() {
    this._x = 1;
    this._y = 0;
  }

  public static create(x: number, y: number): Vector {
    const obj: Vector = new Vector();
    obj.setX(x);
    obj.setY(y);
    return obj;
  }

  public setX(value: number): void {
    this._x = value;
  }

  public getX(): number {
    return this._x;
  }

  public setY(value: number): void {
    this._y = value;
  }

  public getY(): number {
    return this._y;
  }

  public setAngle(angle: number) {
    const length = this.getLength();
    this._x = Math.cos(angle) * length;
    this._y = Math.sin(angle) * length;
  }

  public getAngle(): number {
    return Math.atan2(this._y, this._x);
  }

  public setLength(length: number) {
    const angle = this.getAngle();
    this._x = Math.cos(angle) * length;
    this._y = Math.sin(angle) * length;
  }

  public getLength(): number {
    return Math.sqrt(this._x * this._x + this._y * this._y);
  }

  public add(v2: Vector): Vector {
    return Vector.create(this._x + v2.getX(), this._y + v2.getY());
  }

  public subtract(v2: Vector): Vector {
    return Vector.create(this._x - v2.getX(), this._y - v2.getY());
  }

  public scale(value: number): Vector {
    return Vector.create(this._x * value, this._x * value);
  }
}
