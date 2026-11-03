// c/b — contact record.
export class Contact {
  constructor() {
    this.particle = null;
    this.normal = null; // Vec2, kept by reference (not released in original)
    this.distSq = 0.0;
  }
}
