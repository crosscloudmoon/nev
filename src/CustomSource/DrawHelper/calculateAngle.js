/**
 * [calculateRadians 计算偏角]
 * @positions 坐标数组[[lon,lat,height],[lon,lat,height]]
 * 选取前一个点和后一个点计算航向，如果需要弧度则返回Radian，需要角度则返回Angle
 */
export default function calculateAngle(positions) {
    // 弧度
    let Radian = 0;
    // 角度
    let Angle = 0;
    let x = positions[1][0] - positions[0][0];
    let y = positions[1][1] - positions[0][1];
    if (!(x === 0 && y === 0)) {
        if (y >= 0) {
            Radian = Math.asin(x / Math.sqrt(x * x + y * y));
            Angle = (-Radian * 180) / Math.PI;
        } else if (x !== 0) {
            Radian = Math.asin(x / Math.sqrt(x * x + y * y));
            Angle = (Radian * 180) / Math.PI - 180;
        } else {
            Radian = Math.acos(y / Math.sqrt(x * x + y * y));
            Angle = (Radian * 180) / Math.PI + (90 * Radian) / Math.abs(Radian);
        }
    }
    return Angle;
}
