## GeoGebra Commands mode

    A=(2,4)
    B=(4,3)
    C=(6,5)
    S=(5,10)
    a=Segment[A,B]
    b=Segment[A,C]
    SetLineStyle[b,2]
    c=Segment[B,C]
    d=Segment[S,A]
    e=Segment[S,B]
    f=Segment[S,C]
    A'=Midpoint[d]
    B'=Midpoint[f]
    C'=Midpoint[e]
    g=Segment[A',B']
    SetLineStyle[g,2]
    h=Segment[A',C']
    SetLineStyle[h,2]
    i=Segment[B',C']
    SetLineStyle[i,2]
    p=Polygon[A',B',C']
    SetLineStyle[p,2]
    SetColor[p,green]

## English Natural Language Mode

    Let A, B, C be points.

    Let AB be a line segment.
    Let BC be the line.
    Let M be a midpoint of line segment AB.
    Let ABC be a triangle.

    Let C be a circle with center A and radius 1,7.
    Move point A down to 2.
    Paint point A in yellow.
    Paint point B in green.
    Set point B size 5.
    Move point B left to 1,5.
    Delete point B.

    Let ABCD, GHFT be a quadrilaterals.
