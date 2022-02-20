class satComponents {
    /**
     * 卫星点
     *
     */
    static get Point() {
        return 'Point';
    }
    /**
     * 卫星图标
     *
     */
    static get SatImage() {
        return 'satBillboard';
    }
    /**
     * 卫星名称标注
     *
     */
    static get Label() {
        return 'Label';
    }

    /**
     * 卫星三维模型
     *
     */
    static get Model() {
        return '3D model';
    }

    /**
     * 卫星三维模型
     *
     */
    static get Orbit() {
        return 'Orbit';
    }

    /**
     * 卫星轨道跟踪
     *
     */
    static get OrbitTrack() {
        return 'Orbit track';
    }

    /**
     * 地面扫面线
     *
     */
    static get GroundTrack() {
        return 'Ground track';
    }

    /**
     * 卫星圆锥形波束
     *
     */
    static get SensorCone() {
        return 'Sensor cone';
    }

    /**
     * 卫星方锥形波束
     *
     */
    static get SensorSquareCone() {
        return 'Sensor square cone';
    }

    /**
     * 卫星监测点连线
     *
     */
    static get GroundStationLink() {
        return 'Ground station link';
    }
}

export default satComponents;
