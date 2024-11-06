import { LitElement, html } from "lit"

import characterDirectionList from "./character"
import map from "./map"

class PokemonGame extends LitElement{
    static properties = {
        playerX: {type: Number},
        playerY: {type: Number},
        tileSize: {type: Number},
        animationFrames: {type: Array},
        currentFrame: {type: Number},
        speed: {type: Number},
        animationStartTime: {type: Number},
        isAnimating: {type: Boolean},
        targetX: {type: Number},
        targetY: {type: Number},
        startPosition: {type: Object},
        endPosition: {type: Object},
        characterDirection: {type: String},
        characterDirectionList: {type: Object},
        map: {type: Object}
    }

    constructor(){
        super()
        this.playerX = 2
        this.playerY = 2
        this.tileSize = 0
        this.tileMap = this.createTileMap()

        this.backgroundImage = new Image()
        this.backgroundImage.src = map.palletTown.img
        this.characterImage = new Image()
        this.characterImage.src = './media/character_wo_background.png'

        this.animationFrames = [
            { sourceX: 25, sourceY: 34},
            { sourceX: 9, sourceY: 34},
            { sourceX: 25, sourceY: 34},
            { sourceX: 42, sourceY: 34},
        ]

        this.currentFrame = 0
        this.speed = 0.45
        this.targetX = 0
        this.targetY = 0
        this.startPosition = {x: 0, y: 0}
        this.endPosition = {x: 0, y: 0}

        this.characterDirection = "down"

        this.characterDirectionList = characterDirectionList
        this.map = map
    }

    createTileMap(){
        return map.palletTown.map
    }

    firstUpdated(){
        this.calculateCanvasSize()
        window.addEventListener('resize', this.calculateCanvasSize.bind(this))

        this.backgroundImage.onload = () =>{
            this.startGameLoop()
        }

        window.addEventListener('keydown', this.handleKeyDown.bind(this))
    }

    calculateCanvasSize(){
        const canvas = this.shadowRoot.getElementById('gameCanvas')
        const miniDimension = Math.min(window.innerWidth, window.innerHeight)
        this.tileSize = Math.floor(miniDimension / 20) // 20 tiles wide

        canvas.width = this.tileSize * 20
        canvas.height = this.tileSize * 18

        this.render()
    }

    startGameLoop(){
        const canvas = this.shadowRoot.getElementById('gameCanvas')
        const ctx = canvas.getContext('2d')

        const draw =()=>{
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            this.drawBackground(ctx)
            this.drawPlayer(ctx)
            requestAnimationFrame(draw)
        }

        draw()
    }

    drawBackground(ctx){
        const sourceX = 8 // cropping image
        const sourceY = 24 // cropping image
        const sourceWidth = 319 // width of crop
        const sourceHeight = 287 // crop height

        ctx.drawImage(
            this.backgroundImage,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, ctx.canvas.width, ctx.canvas.height
        )
    }

    drawPlayer(ctx){
        const characterX = this.playerX * this.tileSize
        const characterY = this.playerY * this.tileSize

        const {sourceX, sourceY} = this.animationFrames[this.currentFrame]

        ctx.drawImage(
            this.characterImage,
            sourceX,
            sourceY,
            16, // widht of sprite
            16, // height of sprite
            characterX, // location
            characterY,  // location
            this.tileSize,
            this.tileSize
        )
    }

    handleKeyDown(e){
        if(this.isAnimating) return // prevent multiple key presses
        
        let newX = this.playerX
        let newY = this.playerY

        switch(e.key){
            case 'ArrowUp': 
            case 'w':
                this.characterDirection = "up"
                newY--
                break
            case 'ArrowRight':
            case 'd':
                this.characterDirection = "right"
                newX++
                break
            case 'ArrowDown':
            case 's':
                this.characterDirection = "down"
                newY++
                break
            case 'ArrowLeft':
            case 'a':
                this.characterDirection = "left"
                newX--
                break
            default: return
        }

        this.animationFrames = this.characterDirectionList[this.characterDirection]

        // Check boundaries and non-walkable tiles
        if(
            newX >=0 && newX < this.tileMap[0].length &&
            newY >=0 && newY < this.tileMap.length &&
            this.tileMap[newY][newX] === 0
        ){
            this.startAnimation(newX, newY)
        }
    }

    startAnimation(newX, newY){
        this.isAnimating = true
        this.startPosition = {x: this.playerX, y: this.playerY}
        this.endPosition = {x: newX, y: newY}
        this.animationStartTime = performance.now() // use performance.now() for timing

        const animationLoop = ()=>{
            const currentTime = performance.now()
            const elapsedTime = currentTime - this.animationStartTime

            // calculate progress
            const progress = Math.min(elapsedTime / (this.speed * 1000), 1) // speed in millisceconds
            this.playerX = this.startPosition.x + (this.endPosition.x - this.startPosition.x) * progress
            this.playerY = this.startPosition.y + (this.endPosition.y - this.startPosition.y) * progress

            // update animation frame
            this.currentFrame = Math.floor((progress) * this.animationFrames.length)

            if(progress < 1){
                requestAnimationFrame(animationLoop)
            } else {
                this.isAnimating = false
                this.playerX = this.endPosition.x // snap to final postion
                this.playerY = this.endPosition.y
                this.currentFrame = 0 // reset frame
            }
        }

        animationLoop()
    }

    render(){
        return html`<canvas id="gameCanvas"></canvas>`
    }
}

customElements.define('pokemon-game', PokemonGame)