function TRIANGLE_AREA(p, p1, p2) {
    return (p.x - p1.x) * (p2.y - p1.y) - (p.y - p1.y) * (p2.x - p1.x); /* 辛普森三角 */
}
function TestPoint(x, y, x1, y1, x2, y2) {
    let d = (y2 - y1) * (x1 - x) + (y - y1) * (x2 - x1);
    if (y2 > y1) return y >= y1 && y < y2 && d >= 0.0;
    else return y >= y2 && y < y1 && d < 0.0;
}
function PointInPolygon(pt, x, y) {
    let iCount = pt.length;

    let k = 0;
    for (let i = 0; i < iCount; i++) {
        if (i === iCount - 1) {
            if (TestPoint(x, y, pt[0].x, pt[0].y, pt[i].x, pt[i].y)) k++;
        } else {
            if (TestPoint(x, y, pt[i].x, pt[i].y, pt[i + 1].x, pt[i + 1].y)) k++;
        }
    }
    return k !== 0 && (k & 0x1) !== 0;
}
// eslint-disable-next-line complexity
function IsLineCrossLine(p11, p12, p21, p22) {
    let area1;
    let area2;
    let minx;
    let minY;
    let maxX;
    let maxY;
    let minx1;
    let minY1;
    let maxX1;
    let maxY1;

    if (p11.x > p12.x) {
        minx = p12.x;
        maxX = p11.x;
    } else {
        minx = p11.x;
        maxX = p12.x;
    }
    if (p11.y > p12.y) {
        minY = p12.y;
        maxY = p11.y;
    } else {
        minY = p11.y;
        maxY = p12.y;
    }

    if (p21.x > p22.x) {
        minx1 = p22.x;
        maxX1 = p21.x;
    } else {
        minx1 = p21.x;
        maxX1 = p22.x;
    }
    if (p21.y > p22.y) {
        minY1 = p22.y;
        maxY1 = p21.y;
    } else {
        minY1 = p21.y;
        maxY1 = p22.y;
    }

    if (maxX1 <= minx || minx1 >= maxX || maxY1 <= minY || minY1 >= maxY) return false;

    // 计算线段1起点与线段2围成的泰森三角形面积
    area1 = TRIANGLE_AREA(p11, p21, p22);
    // 计算线段1止点与线段2围成的泰森三角形面积
    area2 = TRIANGLE_AREA(p12, p21, p22);
    // 若线段相接或包含，判为不相交
    if (area1 === 0 || area2 === 0) return false;
    // 若两面积同导,则为同侧,同侧必不相交
    if ((area1 > 0 && area2 > 0) || (area1 < 0 && area2 < 0)) return false;

    // 计算线段2起点与线段1围成的泰森三角形面积
    area1 = TRIANGLE_AREA(p21, p11, p12);
    // 计算线段2止点与线段1围成的泰森三角形面积
    area2 = TRIANGLE_AREA(p22, p11, p12);
    // 若线段相接或包含，判为不相交
    if (area1 === 0 || area2 === 0) return false;
    // 若两面积同导,则为同侧,同侧必不相交
    if ((area1 > 0 && area2 > 0) || (area1 < 0 && area2 < 0)) return false;
    return true;
}

function IsPolygonCrossPolygon(polygon1, polygon2) {
    let iCount1 = polygon1.length;
    let iCount2 = polygon2.length;

    let p1;
    let p2;
    let p3;
    let p4;
    for (let i = 0; i < iCount1; i++) {
        p1 = polygon1[i];
        if (i === iCount1 - 1) {
            p2 = polygon1[0];
        } else {
            p2 = polygon1[i + 1];
        }
        for (let j = 0; j < iCount2; j++) {
            p3 = polygon2[j];
            if (j === iCount2 - 1) {
                p4 = polygon2[0];
            } else {
                p4 = polygon2[j + 1];
            }
            if (IsLineCrossLine(p1, p2, p3, p4)) return true;
        }
    }
    if (IsPolygonInPolygon(polygon1, polygon2) || IsPolygonInPolygon(polygon2, polygon1)) {
        return true;
    }
    return false;
}
function IsPolygonInPolygon(polygon1, polygon2) {
    let iCount1 = polygon1.length;

    let p1 = polygon1[0];
    let p2 = polygon1[iCount1 - 1];
    return IsPolylineInPolygon(polygon1, polygon2) && IsLineInPolygon(p1, p2, polygon2);
}
function IsPolylineInPolygon(pPolyline1, pPolygon2) {
    let iCount1 = pPolyline1.length;

    let p1;
    let p2;
    for (let i = 0; i < iCount1 - 1; i++) {
        p1 = pPolyline1[i];
        p2 = pPolyline1[i + 1];
        if (!IsLineInPolygon(p1, p2, pPolygon2)) return false;
    }
    return true;
}
function IsLineInPolygon(pt1, pt2, pPolygon1) {
    if (!PointInPolygon(pPolygon1, pt1.x, pt1.y) || !PointInPolygon(pPolygon1, pt2.x, pt2.y)) {
        return false;
    }
    let p3;
    let p4;
    let iCount1 = pPolygon1.length;
    for (let i = 0; i < iCount1; i++) {
        p3 = pPolygon1[i];
        if (i === iCount1 - 1) p4 = pPolygon1[0];
        else p4 = pPolygon1[i + 1];
        if (IsLineCrossLine(pt1, pt2, p3, p4)) return false;
    }
    return true;
}

export default {
    IsPolygonCrossPolygon: IsPolygonCrossPolygon,
};
