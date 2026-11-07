"""
SoilPlus — ручной почвенный щуп (Autodesk Fusion, Python API).

Запуск: Shift+S -> Scripts and Add-Ins -> «+» -> выбрать папку SoilPlusProbe -> Run.
Скрипт создаёт НОВЫЙ документ (Z вверх) и строит:
  Т-ручку, штангу (покупная труба 25 мм), блок электроники (корпус, крышка, обойма),
  монтажную плату с гнёздами под модули, стремя-подножку, наконечник с датчиками,
  макеты всех модулей. Потом: соединения (Joints), проверка пересечений,
  экспорт STEP/STL и снимки в папку out/ рядом со скриптом.

Все размеры в мм, в блоке ПАРАМЕТРЫ ниже. Поменял -> Run -> новая модель.

Оси: Z — вверх (Z=0 — поверхность почвы), X — вправо, Y — от пользователя
(крышка блока смотрит в -Y, штанга проходит за блоком по оси Z при X=Y=0).
"""
import adsk.core
import adsk.fusion
import json
import math
import os
import time
import traceback

# =============================================================================
#  ПАРАМЕТРЫ (мм)
# =============================================================================
TUBE_D, TUBE_ID = 25.0, 21.0      # штанга: алюминий 25x2 (или ПВХ 25)
TUBE_Z0, TUBE_Z1 = 132.0, 902.0   # длина трубы 770
SOCKET_D = 25.6                   # гнёзда под трубу в печатных деталях
CLAMP_BORE = 25.0                 # обойма блока — без зазора, зажимает
SCR, CB_D = 3.4, 6.2              # проход M3 / потай под головку M3
INS_D, INS_H = 4.0, 8.0           # латунная вставка M3 (отверстие / глубина)
NUT_AF = 5.7                      # гайка M3 под ключ 5.5 + зазор

# блок электроники (внутренние размеры)
BOX_X = 54.0                      # полуширина внутри (108)
BOX_ZI0, BOX_ZI1 = 642.4, 766.4   # низ/верх внутри (124)
BOX_Y_FRONT, BOX_Y_BACK = -62.4, -18.4   # проём крышки / задняя стенка внутри
WALL = 2.4
PLATE_Y0, PLATE_Y1 = -36.8, -34.4        # монтажная плата (2 яруса: спереди/сзади)

# наконечник
NOSE_HX, NOSE_HY = 26.0, 11.0     # полусечение 52 x 22
NOSE_TIP_Z, NOSE_WEDGE_Z = -105.0, -80.0
NOSE_TOP_Z, NECK_Z0, NECK_Z1 = 5.0, 14.0, 40.0
SKIN = 0.8                        # стенка над датчиком влажности

# стремя
LOOP_HX, LOOP_Z0, LOOP_Z1 = 88.0, 14.0, 160.0   # ширина 176: влезает ботинок
LOOP_HY, BAR_HY = 13.0, 20.0
OPEN_HX, OPEN_Z0, OPEN_Z1 = 58.0, 46.0, 130.0

OUT_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "..", "out")

COLORS = {
    "white": (236, 237, 232), "green": (31, 111, 67), "graphite": (46, 50, 47),
    "alu": (184, 188, 192), "pcb_blue": (37, 84, 199), "pcb_green": (58, 155, 79),
    "black": (25, 25, 25), "yellow": (229, 184, 11), "red": (192, 57, 43),
    "steel": (154, 160, 166), "purple": (123, 47, 191), "ivory": (242, 242, 242),
    "navy": (51, 51, 102),
}

# =============================================================================
#  Служебное
# =============================================================================
app = adsk.core.Application.get()
ui = app.userInterface
VI = adsk.core.ValueInput
FO = adsk.fusion.FeatureOperations
AX = {"x": 0, "y": 1, "z": 2}
LOG = []
FAILS = []
DESIGN = None
ROOT = None
APPEAR = {}


def log(msg):
    LOG.append(time.strftime("%H:%M:%S ") + msg)


def mm(v):
    return v / 10.0


def pt(x, y, z):
    return adsk.core.Point3D.create(mm(x), mm(y), mm(z))


def appearance(key):
    if key in APPEAR:
        return APPEAR[key]
    ap = None
    try:
        lib = None
        for nm in ("Fusion Appearance Library", "Fusion 360 Appearance Library"):
            lib = app.materialLibraries.itemByName(nm)
            if lib:
                break
        base = None
        if lib:
            for nm in ("Plastic - Matte (Yellow)", "Plastic - Glossy (Yellow)", "Paint - Enamel Glossy (Yellow)"):
                base = lib.appearances.itemByName(nm)
                if base:
                    break
            if not base:
                for i in range(lib.appearances.count):
                    if "Plastic" in lib.appearances.item(i).name:
                        base = lib.appearances.item(i)
                        break
        if base:
            ap = DESIGN.appearances.addByCopy(base, "SoilPlus " + key)
            r, g, b = COLORS[key]
            prop = ap.appearanceProperties.itemById("opaque_albedo")
            if not prop:
                for i in range(ap.appearanceProperties.count):
                    p = ap.appearanceProperties.item(i)
                    if p.objectType == adsk.core.ColorProperty.classType():
                        prop = p
                        break
            if prop:
                adsk.core.ColorProperty.cast(prop).value = adsk.core.Color.create(r, g, b, 0)
    except Exception:
        log("appearance %s: %s" % (key, traceback.format_exc(limit=1)))
    APPEAR[key] = ap
    return ap


class Draw:
    """Рисует в эскизе в координатах плоскости (a, b):
    ось z: (x, y); ось y: (x, z); ось x: (y, z)."""

    def __init__(self, part, sk, axis, off):
        self.p, self.sk, self.axis, self.off = part, sk, axis, off
        self.lines = sk.sketchCurves.sketchLines
        self.arcs = sk.sketchCurves.sketchArcs
        self.circles = sk.sketchCurves.sketchCircles

    def S(self, a, b):
        if self.axis == "z":
            w = pt(a, b, self.off)
        elif self.axis == "y":
            w = pt(a, self.off, b)
        else:
            w = pt(self.off, a, b)
        s = self.sk.modelToSketchSpace(w)
        return adsk.core.Point3D.create(s.x, s.y, 0)

    def rect(self, a0, b0, a1, b1):
        self.lines.addTwoPointRectangle(self.S(a0, b0), self.S(a1, b1))

    def circle(self, a, b, d):
        self.circles.addByCenterRadius(self.S(a, b), mm(d) / 2)

    def poly(self, pts):
        n = len(pts)
        for i in range(n):
            self.lines.addByTwoPoints(self.S(*pts[i]), self.S(*pts[(i + 1) % n]))

    def hexagon(self, a, b, af):
        r = af / math.sqrt(3)
        self.poly([(a + r * math.cos(math.radians(60 * i)), b + r * math.sin(math.radians(60 * i))) for i in range(6)])

    def _arc(self, ca, cb, r, ang0, ang1):
        am = (ang0 + ang1) / 2
        f = lambda ang: self.S(ca + r * math.cos(math.radians(ang)), cb + r * math.sin(math.radians(ang)))
        self.arcs.addByThreePoints(f(ang0), f(am), f(ang1))

    def rrect(self, a0, b0, a1, b1, r):
        """Скруглённый прямоугольник; r — число или (лев.низ, прав.низ, прав.верх, лев.верх)."""
        a0, a1 = min(a0, a1), max(a0, a1)
        b0, b1 = min(b0, b1), max(b0, b1)
        bl, br, tr, tl = (r, r, r, r) if isinstance(r, (int, float)) else r
        L = lambda p, q: self.lines.addByTwoPoints(self.S(*p), self.S(*q))
        L((a0 + bl, b0), (a1 - br, b0))
        L((a1, b0 + br), (a1, b1 - tr))
        L((a1 - tr, b1), (a0 + tl, b1))
        L((a0, b1 - tl), (a0, b0 + bl))
        if bl:
            self._arc(a0 + bl, b0 + bl, bl, 180, 270)
        if br:
            self._arc(a1 - br, b0 + br, br, 270, 360)
        if tr:
            self._arc(a1 - tr, b1 - tr, tr, 0, 90)
        if tl:
            self._arc(a0 + tl, b1 - tl, tl, 90, 180)

    def arcband(self, ca, cb, r1, r2, ang0, ang1):
        self._arc(ca, cb, r1, ang0, ang1)
        self._arc(ca, cb, r2, ang0, ang1)
        f = lambda r, ang: (ca + r * math.cos(math.radians(ang)), cb + r * math.sin(math.radians(ang)))
        self.lines.addByTwoPoints(self.S(*f(r1, ang0)), self.S(*f(r2, ang0)))
        self.lines.addByTwoPoints(self.S(*f(r1, ang1)), self.S(*f(r2, ang1)))

    def text(self, s, a, b, h, w):
        try:
            inp = self.sk.sketchTexts.createInput2(s, mm(h))
            inp.setAsMultiLine(self.S(a - w / 2, b - h), self.S(a + w / 2, b + h),
                               adsk.core.HorizontalAlignments.CenterHorizontalAlignment,
                               adsk.core.VerticalAlignments.MiddleVerticalAlignment, 0)
            # читается спереди (со стороны -Y): вправо = +X, вверх = +Z
            o, xa, ya, za = self.sk.transform.getAsCoordinateSystem()
            try:
                inp.isHorizontalFlip = xa.x < 0
                inp.isVerticalFlip = ya.z < 0
            except Exception:
                log("text flip: " + traceback.format_exc(limit=1))
            return self.sk.sketchTexts.add(inp)
        except Exception:
            log("text: " + traceback.format_exc(limit=1))
            return None


class Part:
    def __init__(self, name, color):
        self.occ = ROOT.occurrences.addNewComponent(adsk.core.Matrix3D.create())
        self.comp = self.occ.component
        self.comp.name = name
        self.name, self.color = name, color
        self.body = None
        self.bodies = []
        self.planes = {}

    def plane(self, axis, off):
        key = (axis, round(off, 4))
        if key in self.planes:
            return self.planes[key]
        base = {"z": self.comp.xYConstructionPlane, "y": self.comp.xZConstructionPlane,
                "x": self.comp.yZConstructionPlane}[axis]
        if abs(off) < 1e-9:
            pl = base
        else:
            cps = self.comp.constructionPlanes
            inp = cps.createInput()
            inp.setByOffset(base, VI.createByReal(mm(off)))
            pl = cps.add(inp)
            o = pl.geometry.origin
            if abs([o.x, o.y, o.z][AX[axis]] * 10 - off) > 1e-3:
                pl.deleteMe()
                inp = cps.createInput()
                inp.setByOffset(base, VI.createByReal(mm(-off)))
                pl = cps.add(inp)
            pl.isLightBulbOn = False
        self.planes[key] = pl
        return pl

    @staticmethod
    def normal(sk):
        o, xa, ya, za = sk.transform.getAsCoordinateSystem()
        return (za.x, za.y, za.z)

    def prism(self, axis, a_from, a_to, draw, op="join", tag="", color=None):
        """Эскиз на плоскости axis=a_from, выдавливание до axis=a_to."""
        try:
            sk = self.comp.sketches.add(self.plane(axis, a_from))
            sk.isComputeDeferred = True
            d = Draw(self, sk, axis, a_from)
            ret = draw(d)
            sk.isComputeDeferred = False
            ext = self.comp.features.extrudeFeatures
            if ret is not None and hasattr(ret, "objectType") and "SketchText" in ret.objectType:
                prof = ret
            else:
                if sk.profiles.count == 0:
                    raise RuntimeError("нет замкнутого контура")
                prof = adsk.core.ObjectCollection.create()
                for i in range(sk.profiles.count):
                    prof.add(sk.profiles.item(i))
            fop = {"new": FO.NewBodyFeatureOperation, "join": FO.JoinFeatureOperation,
                   "cut": FO.CutFeatureOperation}[op]
            inp = ext.createInput(prof, fop)
            nz = self.normal(sk)[AX[axis]]
            want = 1 if a_to > a_from else -1
            direc = (adsk.fusion.ExtentDirections.PositiveExtentDirection if nz * want > 0
                     else adsk.fusion.ExtentDirections.NegativeExtentDirection)
            inp.setOneSideExtent(adsk.fusion.DistanceExtentDefinition.create(VI.createByReal(mm(abs(a_to - a_from)))), direc)
            if op != "new" and self.body:
                inp.participantBodies = [self.body]
            f = ext.add(inp)
            sk.isVisible = False
            if op == "new":
                b = f.bodies.item(0)
                b.name = tag or self.name
                ap = appearance(color or self.color)
                if ap:
                    b.appearance = ap
                self.bodies.append(b)
                if self.body is None:
                    self.body = b
                return b
            return f
        except Exception:
            FAILS.append("%s / %s: %s" % (self.name, tag or op, traceback.format_exc(limit=2).splitlines()[-1]))
            return None

    # --- удобные формы
    def box(self, x0, x1, y0, y1, z0, z1, op="join", tag="", color=None):
        return self.prism("z", z0, z1, lambda d: d.rect(x0, y0, x1, y1), op, tag, color)

    def cyl(self, axis, c1, c2, a0, a1, dia, op="join", tag="", color=None):
        return self.prism(axis, a0, a1, lambda d: d.circle(c1, c2, dia), op, tag, color)

    def loft_join(self, z0, draw0, z1, draw1, tag="loft"):
        try:
            secs = []
            for z, draw in ((z0, draw0), (z1, draw1)):
                sk = self.comp.sketches.add(self.plane("z", z))
                draw(Draw(self, sk, "z", z))
                secs.append(sk.profiles.item(0))
                sk.isVisible = False
            lf = self.comp.features.loftFeatures
            inp = lf.createInput(FO.NewBodyFeatureOperation)
            for s in secs:
                inp.loftSections.add(s)
            f = lf.add(inp)
            tool = f.bodies.item(0)
            cf = self.comp.features.combineFeatures
            tools = adsk.core.ObjectCollection.create()
            tools.add(tool)
            ci = cf.createInput(self.body, tools)
            ci.operation = FO.JoinFeatureOperation
            cf.add(ci)
        except Exception:
            FAILS.append("%s / %s: %s" % (self.name, tag, traceback.format_exc(limit=2).splitlines()[-1]))

    def keep_half(self, side):
        """side=-1 оставить y<0 (передняя половина), +1 — y>0."""
        if side < 0:
            self.box(-300, 300, 0, 300, -400, 1200, "cut", "half")
        else:
            self.box(-300, 300, -300, 0, -400, 1200, "cut", "half")


def screw_y(p, x, z, h, kind="insert"):
    """Стяжной винт вдоль Y через две половины (плоскость разъёма y=0).
    Спереди проход + потай под головку, сзади латунная вставка (или гайка)."""
    p.cyl("y", x, z, -h - 1, 0.01, SCR, "cut", "screw")
    p.cyl("y", x, z, -h - 1, -(h - 4 if kind == "nut" else 9), CB_D, "cut", "cbore")
    if kind == "insert":
        p.cyl("y", x, z, -0.01, INS_H, INS_D, "cut", "insert")
    else:
        p.cyl("y", x, z, 0, h + 1, SCR, "cut", "screw")
        p.prism("y", h - 3, h + 1, lambda d: d.hexagon(x, z, NUT_AF), "cut", "nut")


# =============================================================================
#  Детали
# =============================================================================
def build_nose():
    p = Part("4_Nose", "graphite")
    hx, hy = NOSE_HX, NOSE_HY
    p.prism("z", NOSE_TIP_Z, NOSE_TOP_Z, lambda d: d.rrect(-hx, -hy, hx, hy, 6), "new", "Nose")
    p.loft_join(NOSE_TOP_Z, lambda d: d.rrect(-hx, -hy, hx, hy, 6),
                NECK_Z0, lambda d: d.rrect(-17, -9, 17, 9, 4), "transition")
    p.prism("z", NECK_Z0 - 0.01, NECK_Z1, lambda d: d.rrect(-17, -9, 17, 9, 4), "join", "neck")
    # клин (остриё 10 x 6)
    w = NOSE_WEDGE_Z
    for s in (1, -1):
        p.prism("y", -20, 20, lambda d, s=s: d.poly([(s * hx, w), (s * 31, w), (s * 31, -112), (s * 5, -112), (s * 5, NOSE_TIP_Z)]), "cut", "wedge_x")
        p.prism("x", -40, 40, lambda d, s=s: d.poly([(s * hy, w), (s * 16, w), (s * 16, -112), (s * 3, -112), (s * 3, NOSE_TIP_Z)]), "cut", "wedge_y")
    # внутренняя камера и проход в шейку
    p.box(-22, 22, -7.5, 7.5, -2, 6, "cut", "plenum")
    p.prism("z", 5.9, NECK_Z1 + 1, lambda d: d.rrect(-12, -6, 12, 6, 3), "cut", "neck_pass")
    # датчик влажности: щель, карман под электронику, окна до тонкой стенки
    p.box(-15.4, 8.4, -0.95, 0.95, -92.5, 6.1, "cut", "moist_slot")
    p.box(-15.2, 8.2, 0.9, 5.0, -22, 6.1, "cut", "moist_parts")
    p.box(-14, 7, 0.95 + SKIN, 15, -84, -26, "cut", "skin_back")
    p.box(-14, 7, -15, -0.95 - SKIN, -84, -26, "cut", "skin_front")
    # DS18B20 (гильза открыта в окно сбоку)
    p.cyl("z", -21, 6, -62, -1.9, 6.4, "cut", "ds_ch")
    p.box(-30, -21, 3.2, 8.8, -62, -38, "cut", "ds_window")
    # вода: канал + гнездо под трубку 6x8, выход на скосе клина
    p.cyl("z", -21, -6, -100, -1.9, 6.4, "cut", "water")
    p.cyl("z", -21, -6, -17, -1.9, 8.4, "cut", "water_tube")
    # щуп TDS (иглы открыты снизу/сбоку)
    p.cyl("z", 17, 0, -52, -1.9, 12.5, "cut", "tds_ch")
    p.box(10.75, 30, -6.25, 6.25, -68, -52, "cut", "tds_window")
    # штифт-винт шейки
    p.cyl("y", 14.5, 22, -10, 10, SCR, "cut", "neck_pin")
    return p


def build_loop(side):
    name = "3_Stirrup_Front" if side < 0 else "3_Stirrup_Back"
    p = Part(name, "white")
    p.prism("y", -LOOP_HY, LOOP_HY, lambda d: d.rrect(-LOOP_HX, LOOP_Z0, LOOP_HX, LOOP_Z1, (18, 18, 25, 25)), "new", name)
    p.prism("y", -BAR_HY, BAR_HY, lambda d: d.rrect(-LOOP_HX, LOOP_Z0, LOOP_HX, OPEN_Z0, (18, 18, 0, 0)), "join", "bar")
    p.cyl("z", 0, 0, 150, 190, 40, "join", "boss")
    p.prism("y", -30, 30, lambda d: d.rrect(-OPEN_HX, OPEN_Z0, OPEN_HX, OPEN_Z1, 10), "cut", "opening")
    p.cyl("z", 0, 0, TUBE_Z0, 191, SOCKET_D, "cut", "socket")

    def channel(d):  # канал проводов и трубки: шток -> верх -> правая нога -> перекладина -> шейка
        d.rect(0, 138.5, 53, 151.5)
        d.arcband(53, 125, 13.5, 26.5, 0, 90)
        d.rect(66.5, 51, 79.5, 125)
        d.arcband(53, 51, 13.5, 26.5, 270, 360)
        d.rect(0, 24.5, 53, 37.5)
    p.prism("y", -6.5, 6.5, channel, "cut", "channel")
    p.box(-OPEN_HX - 1, OPEN_HX + 1, -20.3, 20.3, 42, 46.1, "cut", "step_pocket")
    p.prism("z", NECK_Z0 - 0.1, NECK_Z1 + 0.3, lambda d: d.rrect(-17.3, -9.3, 17.3, 9.3, 4.3), "cut", "neck_socket")
    screw_y(p, 14.5, 22, BAR_HY, "nut")        # фиксирует наконечник
    screw_y(p, 0, 175, 20, "nut")              # фиксирует трубу (сверлить трубу 3.4)
    for x, z, h in ((-73, 60, LOOP_HY), (-73, 110, LOOP_HY), (78, 148, LOOP_HY), (-35, 145, LOOP_HY),
                    (35, 135, LOOP_HY), (-30, 19, BAR_HY), (30, 19, BAR_HY), (80, 24, BAR_HY), (-80, 24, BAR_HY)):
        screw_y(p, x, z, h)
    p.keep_half(side)
    return p


def build_shaft():
    p = Part("5_Shaft_Tube_25x2", "alu")
    p.cyl("z", 0, 0, TUBE_Z0, TUBE_Z1, TUBE_D, "new", "Tube 25x2 L770 (купить)")
    p.cyl("z", 0, 0, TUBE_Z0 - 1, TUBE_Z1 + 1, TUBE_ID, "cut", "bore")
    for z in (175.0, 880.0):
        p.cyl("y", 0, z, -14, 14, SCR, "cut", "drill")
    p.cyl("y", 0, 700, -14, 0, 10, "cut", "cable_hole")
    return p


def build_handle(side):
    name = "6_Handle_Front" if side < 0 else "6_Handle_Back"
    p = Part(name, "white")
    p.cyl("z", 0, 0, 850, 922, 40, "new", name)
    p.cyl("x", 0, 922, -70, 70, 34, "join", "grip")
    for s in (-1, 1):  # торцы ручки — шайбы-ограничители
        p.cyl("x", 0, 922, s * 70, s * 74, 38, "join", "end")
    p.cyl("z", 0, 0, 849, TUBE_Z1 + 2, SOCKET_D, "cut", "socket")
    p.cyl("z", 0, 0, 900, 945, 9, "cut", "tube_entry")
    screw_y(p, 0, 880, 20, "nut")
    for x in (-45, 45):
        screw_y(p, x, 922, 17)
    p.keep_half(side)
    return p


def build_shell():
    p = Part("1_Head_Shell", "white")
    p.prism("y", BOX_Y_FRONT, BOX_Y_BACK + WALL, lambda d: d.rrect(-BOX_X - WALL, BOX_ZI0 - WALL, BOX_X + WALL, BOX_ZI1 + WALL, 8), "new", "Head shell")
    p.prism("y", BOX_Y_FRONT - 0.1, BOX_Y_BACK, lambda d: d.rrect(-BOX_X, BOX_ZI0, BOX_X, BOX_ZI1, 5.6), "cut", "cavity")
    # угловые колонны под винты крышки
    for sx in (-1, 1):
        for z0, z1 in ((BOX_ZI0, BOX_ZI0 + 7), (BOX_ZI1 - 7, BOX_ZI1)):
            p.box(sx * 47, sx * BOX_X, BOX_Y_FRONT, BOX_Y_BACK, z0, z1, "join", "column")
    for x, z in LID_SCREWS:
        p.cyl("y", x, z, BOX_Y_FRONT - 0.1, BOX_Y_FRONT + INS_H, INS_D, "cut", "lid_insert")
    # бобышки монтажной платы
    for x, z in PLATE_SCREWS:
        p.cyl("y", x, z, PLATE_Y1, BOX_Y_BACK + 0.01, 8, "join", "plate_boss")
        p.cyl("y", x, z, PLATE_Y1 - 0.1, PLATE_Y1 + INS_H, INS_D, "cut", "plate_insert")
    # окна в дне (порты смотрят вниз — дождь не заливает)
    zb0, zb1 = BOX_ZI0 - WALL - 1, BOX_ZI0 + 0.5
    p.prism("z", zb0, zb1, lambda d: d.rrect(-17 - 6.75, -56.6 - 4.25, -17 + 6.75, -56.6 + 4.25, 3), "cut", "usb_esp32")
    p.prism("z", zb0, zb1, lambda d: d.rrect(30 - 6.75, -29.7 - 4.25, 30 + 6.75, -29.7 + 4.25, 3), "cut", "usb_tp4056")
    p.box(-39.6, -20.4, -33.9, -20.7, zb0, zb1, "cut", "switch_kcd1")
    p.cyl("z", 28.5, -47.9, zb0, zb1, 12.5, "cut", "bnc")
    p.box(22.25, 34.75, BOX_Y_FRONT - 1, -47.9, zb0, zb1, "cut", "bnc_slot")
    # ложемент трубы сзади
    p.box(-22, 22, BOX_Y_BACK + WALL - 0.01, 0, BOX_ZI0 - WALL, BOX_ZI1 + WALL, "join", "cradle")
    p.cyl("z", 0, 0, BOX_ZI0 - WALL - 1, BOX_ZI1 + WALL + 1, CLAMP_BORE, "cut", "cradle_bore")
    for x, z in CLAMP_SCREWS:
        p.cyl("y", x, z, -INS_H, 0.1, INS_D, "cut", "clamp_insert")
    p.cyl("y", 0, 700, BOX_Y_BACK - 1, 0.1, 10, "cut", "cable_entry")
    # карман BMP280 справа: открыт снизу, жалюзи сбоку, скос 45° (печать без поддержек)
    xo = BOX_X + WALL
    p.prism("z", 728, 760, lambda d: d.poly([(xo, -56), (xo + 10, -56), (xo + 10, -34), (xo, -24)]), "join", "bmp_pocket")
    p.prism("z", 727, 757.6, lambda d: d.poly([(xo - 0.01, -53.6), (xo + 7.6, -53.6), (xo + 7.6, -35.4), (xo - 0.01, -27.8)]), "cut", "bmp_cavity")
    for z in (734, 741, 748):
        p.box(xo + 6.5, xo + 11, -50, -38, z - 1, z + 1, "cut", "louver")
    p.cyl("x", -30.5, 752, BOX_X - 1, xo + 1, 5, "cut", "bmp_wire")
    return p


LID_SCREWS = [(sx * 50.5, z) for sx in (-1, 1) for z in (BOX_ZI0 + 3.5, BOX_ZI1 - 3.5)]
PLATE_SCREWS = [(sx * 49.5, z) for sx in (-1, 1) for z in (682.4, 727.4)]
CLAMP_SCREWS = [(sx * 17.5, z) for sx in (-1, 1) for z in (652.0, 757.0)]


def build_lid():
    p = Part("2_Head_Lid", "green")
    x0, z0, x1, z1 = -BOX_X - WALL, BOX_ZI0 - WALL, BOX_X + WALL, BOX_ZI1 + WALL
    y1 = BOX_Y_FRONT
    p.prism("y", y1 - 3, y1, lambda d: d.rrect(x0, z0, x1, z1, 8), "new", "Head lid")
    # канавка под шнур Ø2 по ободу корпуса
    p.prism("y", y1 - 1.2, y1 + 0.01, lambda d: d.rrect(-56.0, z0 + 0.4, 56.0, z1 - 0.4, 7.6), "cut", "gasket")
    p.prism("y", y1 - 1.21, y1, lambda d: d.rrect(-54.4, z0 + 2.0, 54.4, z1 - 2.0, 6.0), "join", "gasket_in")
    for x, z in LID_SCREWS:
        p.cyl("y", x, z, y1 - 4, y1 + 1, SCR, "cut", "lid_screw")
    p.box(22.6, 34.4, y1 - 0.01, -54.2, BOX_ZI0 - WALL, BOX_ZI0, "join", "bnc_tab")
    # надписи (вдавлены 0.6)
    yf = y1 - 3
    p.prism("y", yf, yf + 0.6, lambda d: d.text("SoilPlus", 0, 742, 12, 100), "cut", "logo")
    p.prism("y", yf, yf + 0.6, lambda d: d.text("pH  ·  EC  ·  ВЛАЖНОСТЬ  ·  T", 0, 722, 4.5, 100), "cut", "subtitle")
    return p


def build_clamp():
    p = Part("7_Tube_Clamp", "white")
    p.box(-22, 22, 0.6, 16, BOX_ZI0 - WALL, BOX_ZI1 + WALL, "new", "Tube clamp")
    p.cyl("z", 0, 0, BOX_ZI0 - WALL - 1, BOX_ZI1 + WALL + 1, CLAMP_BORE, "cut", "bore")
    for x, z in CLAMP_SCREWS:
        p.cyl("y", x, z, 0, 17, SCR, "cut", "screw")
        p.cyl("y", x, z, 12, 17, CB_D, "cut", "cbore")
    return p


def build_plate():
    p = Part("8_Mount_Plate", "white")
    y0, y1 = PLATE_Y0, PLATE_Y1
    zt, zb = 765.8, 643.0
    p.prism("y", y0, y1, lambda d: d.poly([
        (-46.5, zb), (46.5, zb), (46.5, 650.4), (52, 650.4), (52, 758.4), (46.5, 758.4), (46.5, zt),
        (-46.5, zt), (-46.5, 758.4), (-52, 758.4), (-52, 650.4), (-46.5, 650.4)]), "new", "Mount plate")
    for x, z in PLATE_SCREWS:
        p.cyl("y", x, z, y0 - 0.1, y1 + 0.1, SCR, "cut", "hole")
    p.box(-6, 6, y0 - 1, y1 + 1, 688, 712, "cut", "wire_slot")
    p.box(14, 30, y0 - 1, y1 + 1, 750, 760, "cut", "wire_slot2")
    # ---- передний ярус: перфоплата 50x70 в направляющих (вставляется сверху)
    yf = y0
    p.box(-44.6, -41.2, yf - 6.6, yf, 644, 718, "join", "rail_L")
    p.box(-42.3, -41.19, -42.6, -40.6, 643.5, 719, "cut", "groove_L")
    p.box(7.7, 11.1, yf - 6.6, yf, 644, 718, "join", "rail_R")
    p.box(7.69, 8.3, -42.6, -40.6, 643.5, 719, "cut", "groove_R")
    p.box(-44.6, -38, -42.6, yf, 643, 644, "join", "stop_L")
    p.box(4, 11.1, -42.6, yf, 643, 644, "join", "stop_R")

    def board_pocket(x0, x1, z0, z1, open_bottom, yside, h=6.0, pad=3.0):
        sgn = -1 if yside < 0 else 1
        ya, yb2 = (yf - h, yf) if sgn < 0 else (y1, y1 + h)
        walls = [(x0 - 1.2, x0, z0, z1 + 1.2), (x1, x1 + 1.2, z0, z1 + 1.2), (x0 - 1.2, x1 + 1.2, z1, z1 + 1.2)]
        if not open_bottom:
            walls.append((x0 - 1.2, x1 + 1.2, z0 - 1.2, z0))
        for a0, a1, c0, c1 in walls:
            p.box(a0, a1, ya, yb2, c0, c1, "join", "pocket_wall")
        if pad <= 0.05:
            return
        pa, pb = (yf - pad, yf) if sgn < 0 else (y1, y1 + pad)
        for cx, cz in ((x0, z0), (x1 - 4, z0), (x0, z1 - 4), (x1 - 4, z1 - 4)):
            p.box(cx, cx + 4, pa, pb, cz, cz + 4, "join", "pad")

    board_pocket(12, 45, 643, 686, True, -1)       # pH-4502C, BNC вниз
    board_pocket(12, 45, 690, 733, False, -1)      # TDS v1.0
    # ---- задний ярус: питание
    board_pocket(21.1, 38.9, 643, 672, True, +1, h=4, pad=1.5)          # TP4056
    for x0 in (-43.8, -24.8):                                           # 2 x MT3608
        board_pocket(x0, x0 + 17.6, 663.7, 700.3, False, +1, h=4, pad=1.5)
    board_pocket(8.7, 25.3, 677.7, 713.3, False, +1, h=4, pad=1.5)      # D4184
    board_pocket(-40.5, 10.5, 721.5, 756.5, False, +1, h=6, pad=0.01)   # аккумулятор
    return p


def build_modules():
    p = Part("9_Modules (макеты, не печатать)", "pcb_blue")
    B = lambda name, c, *xyz: p.box(*xyz, op="new", tag=name, color=c)
    # задний ярус
    B("Battery 103450", "yellow", -40, 10, -34.4, -24.4, 722, 756)
    B("TP4056", "pcb_blue", 21.25, 38.75, -32.9, -31.3, 643.4, 671.4)
    B("TP4056 USB-C", "steel", 25.5, 34.5, -31.3, -28.1, 642.6, 649.9)
    for i, x0 in enumerate((-43.5, -24.5)):
        B("MT3608 #%d" % (i + 1), "pcb_blue", x0, x0 + 17, -32.9, -31.3, 664, 700)
        B("MT3608 #%d trim" % (i + 1), "navy", x0 + 3, x0 + 8, -31.3, -21.3, 668, 678)
        B("MT3608 #%d coil" % (i + 1), "black", x0 + 8, x0 + 15, -31.3, -27.3, 685, 692)
    B("D4184", "pcb_blue", 9, 25, -32.9, -31.3, 678, 713)
    B("D4184 term 1", "pcb_green", 9.5, 24.5, -31.3, -19.3, 678.5, 686.5)
    B("D4184 term 2", "pcb_green", 9.5, 24.5, -31.3, -19.3, 704.5, 712.5)
    p.cyl("z", 33, -29.4, 678, 694, 10, "new", "Cap 1000uF", "navy")
    B("KCD1 body", "black", -39.5, -20.5, -33.8, -20.8, 640.2, 660)
    B("KCD1 bezel", "black", -40.5, -19.5, -34.8, -19.8, 637, 640)
    # передний ярус
    B("Perfboard 5x7", "pcb_green", -42, 8, -42.4, -40.8, 644, 714)
    for x in (-30.95, -5.55):
        B("Female header", "black", x, x + 2.5, -50.9, -42.4, 650, 688.1)
        B("Male header", "black", x, x + 2.5, -53.4, -50.9, 650, 688.1)
    B("ESP32 DevKit", "black", -31.25, -2.75, -55.0, -53.4, 643.2, 694.7)
    B("ESP32 module", "steel", -26, -8, -58.1, -55.0, 669.2, 694.7)
    B("ESP32 USB-C", "steel", -21.5, -12.5, -58.2, -55.0, 642.5, 649.8)
    for x in (-40, -30, -20, -10):
        B("JST-XH", "ivory", x, x + 8.5, -49.4, -42.4, 700, 706)
    B("pH-4502C", "pcb_blue", 12.5, 44.5, -41.4, -39.8, 643.5, 685.5)
    B("BNC", "steel", 22.5, 34.5, -54, -41.4, 646, 658)
    p.cyl("z", 28.5, -47.9, 632, 646, 9.6, "new", "BNC barrel", "steel")
    B("pH pot", "navy", 30, 40, -51.4, -41.4, 665, 675)
    B("TDS v1.0", "pcb_blue", 12.5, 44.5, -41.4, -39.8, 690.5, 732.5)
    B("TDS conn", "ivory", 14, 22, -47.4, -41.4, 724, 732)
    B("BMP280", "purple", 58, 59.6, -48, -36.5, 735, 750)
    # наконечник
    B("Soil moisture v1.2", "red", -15, 8, -0.8, 0.8, -92, 6)
    B("Moisture parts", "black", -11, 4, 0.8, 3.8, -20, 0)
    B("Moisture JST", "ivory", -8, 0, -3, 3, 6, 12)
    p.cyl("z", -21, 6, -62, -12, 6, "new", "DS18B20", "steel")
    p.cyl("z", 17, 0, -52, -7, 12, "new", "TDS probe", "black")
    for x in (14, 20):
        p.cyl("z", x, 0, -64, -52, 1.5, "new", "TDS needle", "steel")
    B("Step plate Al 118x40x4", "alu", -OPEN_HX - 0.5, OPEN_HX + 0.5, -20, 20, 42.1, 46)
    return p


# =============================================================================
#  Сборка, проверки, экспорт
# =============================================================================
def joints(parts):
    try:
        shaft = parts["shaft"].occ
        shaft.isGrounded = True
        pairs = [("loop_f", "shaft"), ("loop_b", "shaft"), ("handle_f", "shaft"), ("handle_b", "shaft"),
                 ("shell", "shaft"), ("clamp", "shell"), ("lid", "shell"), ("plate", "shell"),
                 ("modules", "plate"), ("nose", "loop_f")]
        n = 0
        for a, b in pairs:
            try:
                inp = ROOT.asBuiltJoints.createInput(parts[a].occ, parts[b].occ, None)
                inp.setAsRigidJointMotion()
                ROOT.asBuiltJoints.add(inp)
                n += 1
            except Exception:
                FAILS.append("joint %s-%s: %s" % (a, b, traceback.format_exc(limit=1).splitlines()[-1]))
        log("joints: %d" % n)
    except Exception:
        FAILS.append("joints: " + traceback.format_exc(limit=1))


def interference(parts):
    res_list = []
    try:
        coll = adsk.core.ObjectCollection.create()
        for p in parts.values():
            for b in p.bodies:
                coll.add(b.createForAssemblyContext(p.occ))
        inp = DESIGN.createInterferenceInput(coll)
        inp.areCoincidentFacesIncluded = False
        res = DESIGN.analyzeInterference(inp)
        for r in res:
            v = r.interferenceBody.volume * 1000.0
            if v > 0.05:
                res_list.append([r.entityOne.name, r.entityTwo.name, round(v, 2)])
        log("interference: %d" % len(res_list))
    except Exception:
        FAILS.append("interference: " + traceback.format_exc(limit=2))
    return res_list


def export(parts, printed):
    em = DESIGN.exportManager
    os.makedirs(OUT_DIR, exist_ok=True)
    try:
        em.execute(em.createSTEPExportOptions(os.path.join(OUT_DIR, "SoilPlus_Probe.step"), ROOT))
    except Exception:
        FAILS.append("step: " + traceback.format_exc(limit=1))
    sizes = {}
    for key in printed:
        p = parts[key]
        try:
            bb = p.body.boundingBox
            s = sorted([(bb.maxPoint.x - bb.minPoint.x) * 10, (bb.maxPoint.y - bb.minPoint.y) * 10,
                        (bb.maxPoint.z - bb.minPoint.z) * 10])
            sizes[p.name] = [round(v, 1) for v in s]
            o = em.createSTLExportOptions(p.body, os.path.join(OUT_DIR, p.name + ".stl"))
            o.meshRefinement = adsk.fusion.MeshRefinementSettings.MeshRefinementHigh
            em.execute(o)
        except Exception:
            FAILS.append("stl %s: %s" % (p.name, traceback.format_exc(limit=1).splitlines()[-1]))
    return sizes


def shots(parts):
    vp = app.activeViewport
    files = []

    def snap(fn, direction, visible=None):
        try:
            saved = {k: p.occ.isLightBulbOn for k, p in parts.items()}
            if visible is not None:
                for k, p in parts.items():
                    p.occ.isLightBulbOn = k in visible
            lo, hi = [1e9] * 3, [-1e9] * 3
            for k, p in parts.items():
                if visible is not None and k not in visible:
                    continue
                for b in p.bodies:
                    bb = b.boundingBox
                    for i, (mn, mx) in enumerate(((bb.minPoint.x, bb.maxPoint.x), (bb.minPoint.y, bb.maxPoint.y),
                                                  (bb.minPoint.z, bb.maxPoint.z))):
                        lo[i], hi[i] = min(lo[i], mn), max(hi[i], mx)
            c = [(lo[i] + hi[i]) / 2 for i in range(3)]
            size = max(hi[i] - lo[i] for i in range(3))
            n = math.sqrt(sum(v * v for v in direction))
            cam = vp.camera
            cam.isSmoothTransition = False
            cam.target = adsk.core.Point3D.create(*c)
            cam.eye = adsk.core.Point3D.create(*[c[i] + direction[i] / n * size * 3 for i in range(3)])
            cam.upVector = adsk.core.Vector3D.create(0, 0, 1)
            cam.isFitView = True
            vp.camera = cam
            adsk.doEvents()
            vp.refresh()
            path = os.path.join(OUT_DIR, fn)
            vp.saveAsImageFile(path, 1600, 1200)
            files.append(fn)
            for k, p in parts.items():
                p.occ.isLightBulbOn = saved[k]
        except Exception:
            FAILS.append("shot %s: %s" % (fn, traceback.format_exc(limit=1).splitlines()[-1]))

    ISO = (1, -1.4, 0.8)            # спереди-справа-сверху (крышка смотрит в -Y)
    snap("1_iso.png", ISO)
    snap("2_front.png", (0, -1, 0.05))
    snap("3_head_open.png", ISO, {"shell", "clamp", "plate"})
    snap("4_head_bottom.png", (0.3, -0.5, -1), {"shell", "lid", "clamp"})
    snap("5_plate_back.png", (-0.8, 1, 0.5), {"plate"})
    snap("6_stirrup_nose.png", (0, -1, 0.05), {"loop_b", "nose"})
    snap("7_nose_iso.png", ISO, {"nose"})
    snap("8_handle.png", ISO, {"handle_f", "handle_b"})
    return files


def main():
    global DESIGN, ROOT
    t0 = time.time()
    # строим в открытом документе, если он пустой (Hybrid Design), иначе создаём новый
    cur = adsk.fusion.Design.cast(app.activeProduct)
    empty = bool(cur) and cur.rootComponent.occurrences.count == 0 and cur.rootComponent.bRepBodies.count == 0
    yup = empty and (app.preferences.generalPreferences.defaultModelingOrientation ==
                     adsk.core.DefaultModelingOrientations.YUpModelingOrientation)
    if not empty:
        prefs = app.preferences.generalPreferences
        old = prefs.defaultModelingOrientation
        try:
            prefs.defaultModelingOrientation = adsk.core.DefaultModelingOrientations.ZUpModelingOrientation
            app.documents.add(adsk.core.DocumentTypes.FusionDesignDocumentType)
        finally:
            prefs.defaultModelingOrientation = old
    DESIGN = adsk.fusion.Design.cast(app.activeProduct)
    try:  # новые версии Fusion: Part / Assembly / Hybrid — нужен Hybrid (много компонентов)
        DESIGN.designIntent = adsk.fusion.DesignIntentTypes.HybridDesignIntentType
    except Exception:
        pass
    DESIGN.designType = adsk.fusion.DesignTypes.ParametricDesignType
    try:
        log("design intent: %s, up: %s" % (getattr(DESIGN, "designIntent", "?"),
                                           app.preferences.generalPreferences.defaultModelingOrientation))
    except Exception:
        pass
    ROOT = DESIGN.rootComponent

    prog = ui.createProgressDialog()
    prog.show("SoilPlus", "Строю: %v из %m", 0, 14, 0)
    steps = [("shaft", build_shaft), ("nose", build_nose),
             ("loop_f", lambda: build_loop(-1)), ("loop_b", lambda: build_loop(1)),
             ("handle_f", lambda: build_handle(-1)), ("handle_b", lambda: build_handle(1)),
             ("shell", build_shell), ("lid", build_lid), ("clamp", build_clamp),
             ("plate", build_plate), ("modules", build_modules)]
    parts = {}
    for i, (key, fn) in enumerate(steps):
        prog.progressValue = i
        prog.message = "Строю: " + key
        adsk.doEvents()
        ts = time.time()
        parts[key] = fn()
        log("%-9s %.1f s" % (key, time.time() - ts))
    if yup:  # документ с осью Y вверх: поворачиваем всю сборку, чтобы щуп стоял
        try:
            m = adsk.core.Matrix3D.create()
            m.setToRotation(-math.pi / 2, adsk.core.Vector3D.create(1, 0, 0), adsk.core.Point3D.create(0, 0, 0))
            coll = adsk.core.ObjectCollection.create()
            for p in parts.values():
                coll.add(p.occ)
            mi = ROOT.features.moveFeatures.createInput2(coll)
            mi.defineAsFreeMove(m)
            ROOT.features.moveFeatures.add(mi)
            log("rotated for Y-up")
        except Exception:
            FAILS.append("rotate Y-up: " + traceback.format_exc(limit=1).splitlines()[-1])
    prog.message = "Соединения и проверка"
    prog.progressValue = 11
    adsk.doEvents()
    joints(parts)
    clashes = interference(parts)
    prog.progressValue = 12
    prog.message = "Экспорт"
    adsk.doEvents()
    printed = ["nose", "loop_f", "loop_b", "handle_f", "handle_b", "shell", "lid", "clamp", "plate"]
    sizes = export(parts, printed)
    prog.progressValue = 13
    files = shots(parts)
    prog.hide()
    try:
        app.activeViewport.camera.viewOrientation = adsk.core.ViewOrientations.IsoTopRightViewOrientation
        app.activeViewport.fit()
    except Exception:
        pass

    report = {"seconds": round(time.time() - t0, 1), "fails": FAILS, "clashes": clashes,
              "print_sizes_sorted_mm": sizes, "fits_180": {k: max(v) <= 180 for k, v in sizes.items()},
              "shots": files, "log": LOG}
    with open(os.path.join(OUT_DIR, "fusion_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    msg = "Готово за %.0f с.\nОшибок построения: %d\nПересечений: %d\nФайлы: %s" % (
        report["seconds"], len(FAILS), len(clashes), os.path.normpath(OUT_DIR))
    ui.messageBox(msg, "SoilPlus")


def run(context):
    try:
        main()
    except Exception:
        err = traceback.format_exc()
        try:
            os.makedirs(OUT_DIR, exist_ok=True)
            with open(os.path.join(OUT_DIR, "fusion_report.json"), "w", encoding="utf-8") as f:
                json.dump({"fatal": err, "fails": FAILS, "log": LOG}, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
        ui.messageBox("Ошибка:\n" + err, "SoilPlus")
