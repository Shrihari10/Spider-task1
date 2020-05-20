var canvas = document.getElementById("canvas");

var ctx = canvas.getContext("2d");

window.onopen = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setup();
}

window.onresize = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setup();
}

window.onload = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setup();
}

let render; 
let stop;
let stopTimer;
let timer = 10;
let time = 1500;
let index = 0;
let balls = [];
let flag = 0;

let countDown = document.getElementById("countdown");
let canvasArea;
let ballArea = 0;

let burstSound = new Audio();
burstSound.src = "burst.flac";

let pauseScreen = document.getElementById('pausescreen');

let resumeImage;
resumeImage = document.createElement("img");
resumeImage.setAttribute("id","resume");
resumeImage.src = "play.svg";

let reloadImage;
reloadImage = document.createElement("img");
reloadImage.setAttribute("id","reload");
reloadImage.src = "reload.svg";


let pauseImage = document.createElement("img");
pauseImage.src = "pause.svg";
let pauseButton = document.getElementById("pause");
pauseButton.appendChild(pauseImage);
pauseButton.addEventListener('click',pauseGame);

let gameEnd = document.getElementById("gameover");
gameEnd.appendChild(reloadImage);

canvas.addEventListener('click', burst);

let best = JSON.parse(localStorage.getItem('maxscore'));

var score = document.createElement("div");
score.setAttribute("id","score");
document.getElementsByTagName("body")[0].appendChild(score);
score.innerHTML = "SCORE : 0";

var highScore = document.createElement("div");
highScore.setAttribute("id","highscore");
document.getElementsByTagName("body")[0].appendChild(highScore);

    if(best == null)
       { localStorage.setItem('maxscore','0');
        highScore.innerHTML = "BEST SCORE : 0";
        } 
    else
    {    localStorage.setItem('maxscore',JSON.stringify(best));
        highScore.innerHTML = "BEST SCORE : " + best;
    }


function rotate( xvelocity, yvelocity, angle) {
    
    const rotatedVelocity = {
        x: xvelocity * Math.cos(angle) - yvelocity * Math.sin(angle),
        y: xvelocity * Math.sin(angle) + yvelocity * Math.cos(angle)
    };
    return rotatedVelocity;
}

function resolveCollision(ball1, ball2) {

    const dxDiff = ball1.dx - ball2.dx;
    const dyDiff = ball1.dy - ball2.dy;

    const xDiff = ball2.x - ball1.x;
    const yDiff = ball2.y - ball1.y;

    if (dxDiff * xDiff + dyDiff * yDiff >= 0) {

        const angle = -Math.atan2(ball2.y - ball1.y, ball2.x - ball1.x);

        const m1 = ball1.mass;
        const m2 = ball2.mass;

        const u1 = rotate(ball1.dx,ball1.dy, angle);
        const u2 = rotate(ball2.dx,ball2.dy, angle);

        const v1 = {
                    x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2),
                    y: u1.y 
                    };
        const v2 = { 
                    x: u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m2 / (m1 + m2), 
                    y: u2.y 
                    };

        const velocity1 = rotate( v1.x, v1.y, -angle);
        const velocity2 = rotate( v2.x, v2.y, -angle);

        ball1.dx = velocity1.x;
        ball1.dy = velocity1.y;

        ball2.dx = velocity2.x;
        ball2.dy = velocity2.y;

    }
}

function distance(x1,y1,x2,y2) {
    let xDistance = x1 - x2;
    let yDistance = y1 - y2;

    return Math.sqrt(Math.pow(xDistance,2) + Math.pow(yDistance,2));

}
function countTimer(){
    if(ballArea >= 0.3*canvasArea)
    {
        countDown.innerText = timer;
        timer -= 1;
        if(timer <= -1)
         {   
            flag = 0;
            clearInterval(stopTimer);
            clearInterval(render);
            clearTimeout(stop);
            gameEndScreen(count);
            canvas.removeEventListener('click',burst);
         }
    }
    else 
    {
        countDown.innerHTML = "";
        timer = 10;
        flag = 0;
        clearInterval(stopTimer);
    }
}

function areaCheck(){
    ballArea = 0;
    canvasArea = canvas.height*canvas.width;
    for(let i=0;i<balls.length;i++)
        ballArea += Math.PI*balls[i].r*balls[i].r;
    if(flag == 0)
      {  stopTimer = setInterval(countTimer,1000);
            flag = 1;
      }    
}

function dispScore(max){
    score.innerHTML ="SCORE : " + max;
    dispBestScore(max);
}

function dispBestScore(max){
    best = JSON.parse(localStorage.getItem('maxscore'));
    if(max>best)
    {
    localStorage.setItem('maxscore',JSON.stringify(max));
    highScore.innerHTML ="BEST SCORE : " + max;
    }
}

function burstAudio() {
    burstSound.play();
}
function winScreen(){
    clearInterval(render);
    clearTimeout(stop);
    clearInterval(stopTimer);
    countDown.innerHTML = "";
    gameEnd.innerText = "You Win!"; 
    gameEnd.appendChild(reloadImage);
    gameEnd.style.display = "block";
    reloadImage.addEventListener('click',reload);
}

function gameEndScreen(max) {
    countDown.innerHTML = "";
    gameEnd.innerText = "SCORE : " + max; 
    gameEnd.appendChild(reloadImage);
    gameEnd.style.display = "block";
    reloadImage.addEventListener('click',reload);
}

function resume() {
    flag=0;
    setTimeout(update,1000);
    pauseButton.addEventListener('click',pauseGame);
    resumeImage.removeEventListener('click',resume);
    reloadImage.removeEventListener('click',reload);
    pauseScreen.style.display = "none";
}

function reload() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    gameEnd.style.display = "none";
    pauseScreen.style.display = "none";
    pauseButton.addEventListener('click',pauseGame);
    reloadImage.removeEventListener('click',reload);
    resumeImage.removeEventListener('click',resume);
    setup();
}

function pauseGame() {

    pauseButton.removeEventListener('click',pauseGame);
    clearInterval(render);
    clearTimeout(stop);
    clearInterval(stopTimer);
    pauseScreen.appendChild(resumeImage);
    pauseScreen.appendChild(reloadImage);
    pauseScreen.style.display = "block";

    resumeImage.addEventListener('click',resume);

    reloadImage.addEventListener('click',reload);
}

function genBubbles() {

    let r = Math.floor(Math.random()*canvas.width/20) +10;
    let x = Math.random()*(canvas.width - r*2) +r;
    let y = Math.random()*(canvas.height - r*2) +r;
    let c = 'white';

    for(let j=0;j<balls.length;j++)
    {
        if(distance(x,y,balls[j].x,balls[j].y) < r + balls[j].r)
        {
            x = Math.random()*(canvas.width - r*2) +r;
            y = Math.random()*(canvas.height - r*2) +r;
            j = -1;
        }
        
    }
    if(time<500)
        time = 500;
    else
        time-= 10;

    balls.push(new Circle(x,y,r,c));
    index += 1;

        stop = setTimeout(genBubbles,time);
        
}

function setup(){
    clearInterval(render);
    clearTimeout(stop);
    clearInterval(stopTimer);

    balls = [];
    timer = 10;
    canvas.addEventListener('click',burst);
    score.innerText = "SCORE : 0" ;

    for(let i=0;i<20;i++)
    {

    let r = Math.floor(Math.random()*canvas.width/20) + 10;
    let x = Math.random()*(canvas.width - r*2) +r;
    let y = Math.random()*(canvas.height - r*2) +r;
    let c = 'white';
    
    if(i!==0)
    {
        for(let j=0;j<balls.length;j++)
        {
            if(distance(x,y,balls[j].x,balls[j].y) < r + balls[j].r)
            {
                x = Math.random()*(canvas.width - r*2) +r;
                y = Math.random()*(canvas.height - r*2) +r;
                j = -1;
            }
            
        }
    }

    balls.push(new Circle(x,y,r,c));
    balls[i].draw();
    }
    flag = 0;
    count = 0;
    update();

}

function Circle(x,y,r,c){
    this.x = x;
    this.y = y;
    this.r = r;
    this.c = c;
    this.mass = 1;

    this.dx = ((Math.random()*1)+0.1)*((Math.random()*1)-0.5)*2;
    this.dy = ((Math.random()*1)+0.1)*((Math.random()*1)-0.5)*2; 

    this.draw = function () {

        ctx.beginPath();
        ctx.fillStyle = this.c;
        ctx.arc(this.x,this.y,this.r, 0, Math.PI*2);
        ctx.fill();

    }

    this.animate = function () {
        this.x += this.dx;
        this.y += this.dy;

        if ((this.x > canvas.width - this.r) || (this.x < this.r))
            this.dx = -this.dx;
        if ((this.y > canvas.height - this.r ) || (this.y < this.r))
            this.dy = -this.dy;
        
        for(i=0;i<balls.length;i++)
        {
            if(this === balls[i])
                continue;
            else if ( distance(this.x,this.y,balls[i].x,balls[i].y) <= this.r + balls[i].r + 3 )
            { 
                resolveCollision(this,balls[i]);  
             }
        }    
        this.draw();
    }

    this.click = function (event) {
        if( distance(event.clientX,event.clientY,this.x,this.y) <= this.r + 1)
            for(var i =0;i<balls.length;i++)
                if(this == balls[i])
                {
                    balls.splice(i,1);
                    burstAudio();
                    count ++;
                    dispScore(count);
                }
        }

}

    function burst() {
        for(let i=0;i<balls.length;i++)
            balls[i].click(event);
    }

function update(){
    genBubbles();
   render = setInterval( function(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    areaCheck();
    for (var i=0;i<balls.length;i++)
        balls[i].animate();
    if(balls.length==0)
    {
        winScreen();
    }
   },16);
}
