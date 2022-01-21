import { AfterViewInit, Component } from '@angular/core';
import { Particle } from './models/particle.model';
import { Vector } from './models/vector.model';
import { TweenMax, Elastic, Power1, Power2, Power3 } from 'gsap/all';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  // Ball and basket
  public ball;
  private offsetY;
  private ballRadius;
  private basket;
  private basketWidth;
  private ratio;
  private scale;
  private w;
  private h;

  // Motion
  private p;
  private start;
  private force;
  private timestamp = null;
  private lastMouse;
  private hasThrown = false;
  private highEnough = false;
  private lastY;
  private rot;

  // Score vars
  private shots = 0;
  private hits = 0;
  private score = 0;
  private accuracy = 0;

  public ngAfterViewInit(): void {
    // Ball and basket vars
    this.ball = document.getElementById('ball');

    this.basket = document.getElementById('basket');

    window.addEventListener('resize', this.resize.bind(this));
    window.addEventListener('orientationchange', this.resize.bind(this));

    this.resize();

    // Wait a second before fading the elements in to prevent a flash of unpositioned/unstyled content
    TweenMax.to('.stage', { duration: 1, autoAlpha: 1, delay: 1 });
  }

  private addEvents() {
    this.ball.addEventListener('mousedown', this.grabBall.bind(this));
    this.ball.addEventListener('touchstart', this.grabBall.bind(this));
    this.ball.addEventListener('mouseup', this.releaseBall.bind(this));
    this.ball.addEventListener('touchend', this.releaseBall.bind(this));
  }

  private removeEvents() {
    this.ball.removeEventListener('mousedown', this.grabBall);
    this.ball.removeEventListener('touchstart', this.grabBall);
    this.ball.removeEventListener('mouseup', this.releaseBall);
    this.ball.removeEventListener('touchend', this.releaseBall);
  }

  private resize() {
    // For some reason, we need to re-add the touch events every time the orientation change, if we don't the touchmove fails after the touchstart. Bizzarre.
    this.removeEvents();

    this.addEvents();

    this.offsetY = this.ball.getBoundingClientRect().height * 1.5;

    // Find the smallest value of the SVG holding the basketball - it will give us the ball's radius
    this.ballRadius = Math.min(
      this.ball.getBoundingClientRect().width,
      this.ball.getBoundingClientRect().height
    );

    this.basketWidth = Math.round(
      this.basket.querySelector('rect').getBoundingClientRect().width
    );

    // Work out how the ratio between the basket's width and the ball's radius, make it a tiny smaller just for safety
    this.ratio = this.basketWidth / this.ballRadius - 0.1;

    this.w = window.innerWidth;
    this.h = window.innerHeight;

    // Make sure the basketall has no previous GSAP's transforms on it
    TweenMax.set(this.ball, { clearProps: 'all' });

    // Move the basketball to its starting offset
    TweenMax.set(this.ball, { y: '+=' + this.offsetY }); // We need a number rather than a percentage to use later with collision calculation.

    this.scale = TweenMax.to(this.ball, {
      duration: 0.5,
      scale: this.ratio,
      ease: Power1.easeInOut,
    })
      .progress(1)
      .pause(0);
  }

  private tick() {
    var currY = this.p.position.getY();
    var currX = this.p.position.getX();

    if (this.hasThrown) {
      if (currY < 0) {
        this.highEnough = true;
      }

      // Has the ball been thrown high enough
      if (this.highEnough) {
        // Is it falling?
        if (this.lastY < currY && this.force.getLength() > 15) {
          this.basket.style.zIndex = 1;

          // Has it hit the basket
          if (currY < 10 && currY > -10) {
            this.hasThrown = false;

            // Was it on target?
            if (
              (currX > this.basketWidth * 0.1 && currX < this.basketWidth) ||
              (currX < -this.basketWidth * 0.1 && currX > -this.basketWidth)
            ) {
              // Create an oposite force angled in relation to the basket
              this.force.setX(currX / 10);
              this.force.setLength(this.force.getLength() * 0.7);
              this.p.velocity = this.force;

              this.basket.style.zIndex = 0;
            } else if (
              currX <= this.basketWidth &&
              currX >= -this.basketWidth
            ) {
              // Yes
              this.score += 2;
              this.hits += 1;

              // Three pointer?
              if (this.force.getX() > 2 || this.force.getX() < -2) {
                this.score += 1;
              }

              TweenMax.to('#net', {
                duration: 1,
                scaleY: 1.1,
                transformOrigin: '50% 0',
                ease: Elastic.easeOut,
              });
              TweenMax.to('#net', {
                duration: 0.3,
                scale: 1,
                transformOrigin: '50% 0',
                ease: Power2.easeInOut,
                delay: 0.6,
              });
            }
          }
        }
      }
    }
    this.p.update();
    TweenMax.set(this.ball, {
      x: this.p.position.getX(),
      y: currY,
      rotation: this.rot,
    });

    this.lastY = currY;
  }

  private grabBall(e) {
    e.preventDefault();

    this.p = Particle.create(0, this.offsetY, 0, 0, 0);
    this.force = Vector.create(0, 0);
    this.start = Vector.create(
      this.getMouse(e).x,
      this.getMouse(e).y - this.offsetY
    );

    document.addEventListener('mousemove', this.moveBall.bind(this));
    document.addEventListener('touchmove', this.moveBall.bind(this));
  }

  private moveBall(e) {
    e.preventDefault();

    this.getSpeed(e);

    //  Update the ball's position
    TweenMax.set(this.ball, {
      x: this.p.position.getX(),
      y: this.p.position.getY(),
    });
  }

  private releaseBall() {
    // Stop tracking the mousedown/touchdown
    this.ball.removeEventListener('mousedown', this.grabBall);
    this.ball.removeEventListener('touchstart', this.grabBall);
    // Stop tracking the mousemove
    document.removeEventListener('mousemove', this.moveBall);
    document.removeEventListener('touchmove', this.moveBall);
    // Reset the mouse tracking defaults
    this.timestamp = null;
    const lastMouseX = null;
    const lastMouseY = null;

    this.hasThrown = true;

    this.shots += 1;

    this.scale.play(0);

    // Limit how hard the ball can be thrown. Improves user accuracy diminishes realistic movement
    if (this.force.getLength() > 30) {
      this.force.setLength(30);
    }
    this.p.velocity = this.force;
    this.p.gravity = Vector.create(0, 0.8);

    if (this.force.getX() > 0) {
      this.rot = '-=4';
    } else {
      this.rot = '+=4';
    }

    //  Start GSAP's tick so more physics-like movement can take place
    TweenMax.ticker.addEventListener('tick', this.tick.bind(this));

    // Stop it after some period of time - saves having to write edges and floor logic and the user can shoot every three seconds or so
    TweenMax.delayedCall(2, this.reset.bind(this));
  }

  private reset() {
    TweenMax.ticker.removeEventListener('tick', this.tick);

    this.p.gravity = Vector.create(0, 0);

    this.hasThrown = false;
    this.highEnough = false;

    this.basket.style.zIndex = 0;

    this.ball.addEventListener('mousedown', this.grabBall.bind(this));
    this.ball.addEventListener('touchstart', this.grabBall.bind(this));

    this.updateScore();

    TweenMax.to(this.ball, {
      duration: 1,
      x: 0,
      y: this.offsetY,
      scale: 1,
      rotation: 0,
      ease: Power3.easeOut,
    });
  }

  private getMouse(e) {
    return {
      x: e.clientX || e.targetTouches[0].clientX,
      y: e.clientY || e.targetTouches[0].clientY,
    };
  }

  private getSpeed(e) {
    e.preventDefault();

    if (this.timestamp === null) {
      this.timestamp = Date.now();
      this.lastMouse = this.getMouse(e);
      return;
    }

    var now = Date.now(),
      currMouse = this.getMouse(e),
      dx = currMouse.x - this.lastMouse.x,
      dy = currMouse.y - this.lastMouse.y;

    // Let's make the angle less steep
    dy *= 2;
    dx /= 2;

    this.timestamp = now;
    this.lastMouse = currMouse;

    this.force = Vector.create(dx, dy);
    this.p.position.setX(this.getMouse(e).x - this.start.getX());
    this.p.position.setY(this.getMouse(e).y - this.start.getY());
  }

  private updateScore() {
    this.accuracy = this.hits / this.shots;

    document.getElementById('shots').innerHTML = 'Shots: ' + this.shots;
    document.getElementById('hits').innerHTML = 'Score: ' + this.score;
    document.getElementById('accuracy').innerHTML =
      'Accuracy: ' + Math.round(this.accuracy * 100) + '%';
  }
}
