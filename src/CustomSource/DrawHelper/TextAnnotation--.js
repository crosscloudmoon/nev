
const BillboardCollection = Cesium.BillboardCollection;
const Cartesian3 = Cesium.Cartesian3;
const createGuid = Cesium.createGuid;

export default class TextAnnotation extends BillboardCollection {
	constructor(options) {
		super({
			scene: options.scene
		});
        super.add(options);
        this._scene = options.scene;
        this._id = options.id || createGuid()

        this.createSVG(options.position);
        this.listenerCameraMoveStart();
	}

	createSVG(position) {
        if(!this._scene){
            throw new Error("缺少场景信息")
        }
        let windowCoordinate = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this._scene, position);

        let svgDiv = this._scene.canvas.parentNode;
        let style = "position: fixed"
        let svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); 
        svg.setAttribute("id", this._id);
        svg.setAttribute("height",'100%');
        svg.setAttribute("width",'100%');
        svg.setAttribute("style", style);
        svg.style.top = windowCoordinate.y + "px";
        svg.style.left = windowCoordinate.x + "px";
        svg.style["pointer-events"] = "none";

        let polyline = document.createElementNS('http://www.w3.org/2000/svg','polyline'); 
        polyline.setAttribute("id", this._id + "polyline");
        polyline.setAttribute("points", "0,0 20,20 30,20");
        polyline.setAttribute("style",'fill:rgba(0,0,0,0);stroke:red;stroke-width:2');
        svg.appendChild(polyline);
        let ray = this._scene.camera.getPickRay(windowCoordinate);
        let cartesian = this._scene.globe.pick(ray, this._scene);
        if(cartesian && cartesian.equals(position)){
            svg.style.display = "block"
            svg.style.top = windowCoordinate.y + "px";
            svg.style.left = windowCoordinate.x + "px";
        }else{
            svg.style.display = "none"
        }
        svgDiv.appendChild(svg);
	}

	createDOM() {

	}

    listenerCameraMoveStart(){
        let _self = this;
        this._scene.camera.moveStart.addEventListener(() => {
            _self.addTickEvent();
            _self.listenerCameraMoveEnd();
        });
    }

    addTickEvent(){
        let _self = this;
        let svg = document.getElementById(this._id);
        this.tickEvent = this._scene.preRender.addEventListener(()=>{
            let position = _self.get(0).position;
            let windowCoordinate = Cesium.SceneTransforms.wgs84ToWindowCoordinates(_self._scene, position);
            if(!windowCoordinate){
                svg.style.display = "none"
                return
            }
            let ray = _self._scene.camera.getPickRay(windowCoordinate);
            let cartesian = _self._scene.globe.pick(ray, _self._scene);
            if(cartesian && cartesian.equals(position)){
                svg.style.display = "block"
                svg.style.top = windowCoordinate.y + "px";
                svg.style.left = windowCoordinate.x + "px";
            }else{
                svg.style.display = "none"
            }
        })
    }

    removeTickEvent(){
        this.tickEvent()
    }

    listenerCameraMoveEnd(){
        let _self = this;
        this._scene.camera.moveEnd.addEventListener(() => {
            _self.removeTickEvent()
        });
    }

	destroy() {
		this.removeAll();
		this._primitives.remove(this);
    }
    
	set show(flag) {
		this._billboards[0].show = flag;
	}
	getType() {
		return 'marker';
	}
}
