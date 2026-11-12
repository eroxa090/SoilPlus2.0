"""
SoilPlus Mini — короткий ручной щуп (Autodesk Fusion, Python API).

Запуск: UTILITIES -> Scripts and Add-Ins -> «+» -> папка SoilPlusMini -> Run.
Открой пустой документ Hybrid Design; если документ не пустой, скрипт создаст новый.

Строит: блок электроники, крышку, панель, Т-ручку, горловину с юбкой-упором,
защитную вилку датчика влажности, колпачок и макеты модулей. Потом соединения,
проверка пересечений, экспорт STEP/STL и снимки в папку out/ рядом со скриптом.

Оси: Z вверх (Z=0 — поверхность почвы), X вправо, крышка блока смотрит в -Y.
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
CLR = 0.3                  # зазор посадки на сторону для всего, что вставляется или скользит
SCR, CB_D = 3.6, 6.2       # проход M3 (3.0 + 2*CLR) / головка M3 5.5 + зазор
INS_D, INS_H = 4.0, 8.0    # латунная вставка M3 (отверстие / глубина)

# блок: наружные полуразмеры и высоты
BX, IX = 47.5, 45.1        # наружная / внутренняя полуширина
Z0, Z1 = 54.0, 149.0       # низ / верх блока
IZ0, IZ1 = 56.4, 146.6     # внутри
YO, YB, YBI = -21.0, 24.0, 21.6   # плоскость крышки, задняя стенка снаружи / внутри
LID_Y = -24.0              # лицо крышки
DECK_Y0, DECK_Y1 = 3.2, 5.6       # панель переднего яруса
FRAME_Y1 = 7.6             # прижимная рамка заднего яруса: от DECK_Y1 до FRAME_Y1
EARS = [(sx, z) for sx in (-1, 1) for z in (62.0, 142.0)]         # винты крышки
BOSSES = [(sx * 41.5, z) for sx in (-1, 1) for z in (93.0, 136.5)]  # стойки панели
HEAD_SCREWS = [(sx * 33.0, sy * 12.5) for sx in (-1, 1) for sy in (-1, 1)]
GRIP_SCREWS = [(sx * 34.0, sy * 7.0) for sx in (-1, 1) for sy in (-1, 1)]
JAW_Z = 24.0               # высота зажима датчиков
CLAMP_SCREWS = [(-16.0, 13.0), (16.0, 13.0), (-24.0, 16.0), (23.5, 16.0)]   # 4 винта зажима
DS_X = -32.0               # ось DS18B20
ELECTRODE_D = 18.5         # замер: корпус электрода pH
ELECTRODE_CAP_D = 21.5     # замер: колпачок
ELECTRODE_CAP_L = 51.5     # замер: длина колпачка
ELECTRODE_L = 185.0        # замер: общая длина с колпачком
ELECTRODE_Y = 37.0         # ось электрода за блоком
# Размеры, которые надо сверить по реальным деталям:
BNC_Z = 74.5               # высота оси BNC (центр платы pH по её короткой стороне)
BNC_Y = -7.9               # ось BNC над платой pH (плата y=-1.4, ось на 6.5 выше)
BAT_L = 52.0               # 103450 с платой защиты (продавцы: 50 голая банка, 52 с платой)
BAT_W = 34.5               # 103450 с платой защиты: 34–34.5
TDS_D = 12.0               # корпус щупа TDS: в паспорте нет, губка на шарнире зажмёт Ø11.7–13.2

# Куда сохранять (рядом со скриптом)
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


# =============================================================================
#  Детали
# =============================================================================
def build_body():
    p = Part("1_Body", "white")
    p.prism("y", YO, YB, lambda d: d.rrect(-BX, Z0, BX, Z1, 6), "new", "Body")
    p.prism("y", YO - 0.1, YBI, lambda d: d.rrect(-IX, IZ0, IX, IZ1, 3.6), "cut", "cavity")
    # ушки под винты крышки (скос 45° — печать без поддержек)
    for sx, zc in EARS:
        p.prism("z", zc - 4, zc + 4, lambda d, sx=sx: d.poly(
            [(sx * 46.5, YO), (sx * 54, YO), (sx * 54, 5), (sx * 46.5, 12.5)]), "join", "ear")
        p.cyl("y", sx * 50.75, zc, YO - 0.1, YO + INS_H, INS_D, "cut", "lid_insert")
    # стойки панели
    for x, z in BOSSES:
        p.cyl("y", x, z, FRAME_Y1, YBI + 0.01, 8, "join", "boss")
        p.cyl("y", x, z, FRAME_Y1 - 0.1, FRAME_Y1 + INS_H, INS_D, "cut", "boss_insert")
    # задний ярус: гнёзда прямо на задней стенке
    w = lambda x0, x1, z0, z1, h=4.0: p.box(x0, x1, YBI - h, YBI + 0.01, z0, z1, "join", "pocket")
    pad = lambda x0, x1, z0, z1: p.box(x0, x1, YBI - 1.5, YBI + 0.01, z0, z1, "join", "pad")
    # TP4056 (Type-C влево): упоры со всех сторон, сверху прижимает рамка
    w(-15.9, -14.5, 96.5, 117.0); w(-45.2, -14.5, 96.5, 97.7); w(-45.2, -14.5, 115.8, 117.0)
    w(-45.2, -44.7, 97.6, 100.5); w(-45.2, -44.7, 113.0, 115.9)
    pad(-44.4, -16.4, 98.0, 99.5); pad(-44.4, -16.4, 114.0, 115.5)
    # MT3608
    w(-6.8, -5.4, 62.5, 83.0); w(-45.2, -5.4, 62.5, 63.7); w(-45.2, -5.4, 81.8, 83.0)
    w(-45.2, -44.4, 63.6, 81.9)
    pad(-44.1, -7.1, 64.0, 65.5); pad(-44.1, -7.1, 80.0, 81.5)
    # аккумулятор: упор справа — стенка корпуса; слева вырез под провода
    bx0 = IX - BAT_L - 2 * CLR
    bz0, bz1 = 114.75 - BAT_W / 2 - CLR, 114.75 + BAT_W / 2 + CLR
    w(bx0 - 1.2, bx0, bz0 - 1.2, 110.0, 6); w(bx0 - 1.2, bx0, 118.0, bz1 + 1.2, 6)
    w(bx0 - 1.2, IX, bz0 - 1.2, bz0, 6); w(bx0 - 1.2, IX, bz1, bz1 + 1.2, 6)
    # порты: слева 2 x Type-C, справа BNC и тумблер
    usb = lambda y, z: p.prism("x", -BX - 1, -IX + 0.5, lambda d: d.rrect(y - 4.25, z - 6.75, y + 4.25, z + 6.75, 3), "cut", "usb")
    usb(16.9, 106.75)                                                          # TP4056
    p.box(-BX - 1, -IX + 0.5, YO - 0.1, -12.35, 104.5, 119.5, "cut", "usb_esp32")   # открыто к крышке, высота 15 — запас под сетку перфоплаты
    p.box(IX - 0.5, BX + 1, 13.5 - 6.5 - CLR, 13.5 + 6.5 + CLR, 77.6 - 9.5 - CLR, 77.6 + 9.5 + CLR, "cut", "switch_kcd1")   # KCD1 2 pin: корпус 19x13
    p.cyl("x", BNC_Y, BNC_Z, IX - 0.5, BX + 1, 12.5, "cut", "bnc")
    p.box(IX - 0.5, BX + 1, YO - 0.1, BNC_Y, BNC_Z - 6.25, BNC_Z + 6.25, "cut", "bnc_slot")
    # BMP280: карман справа, открыт снизу, жалюзи сбоку
    p.box(BX - 0.5, BX + 9.5, 0, YB, 110, 140, "join", "bmp_pocket")
    p.box(BX, BX + 7.1, 2.4, YBI, 109, 137.6, "cut", "bmp_cavity")
    for zc in (118, 125, 132):
        p.box(BX + 7.0, BX + 10.5, 5, 19, zc - 1, zc + 1, "cut", "louver")
    p.box(IX - 0.6, BX + 0.5, 7.75, 11.25, 120.0, 131.5, "cut", "bmp_wire")   # пролезает разъём Dupont 1x4
    # BMP280 вставляется снизу в пазы до упора, снизу запирается штифтом из филамента 1.75
    for y0_, y1_, g0, g1 in ((4.4, 7.0, 5.95, 7.01), (16.5, 19.1, 16.49, 17.55)):
        p.box(BX - 0.1, BX + 7.2, y0_, y1_, 116, 137.7, "join", "bmp_rail")
        p.box(50.8 - 0.8 - CLR, 50.8 + 0.8 + CLR, g0, g1, 115.9, 132.0 + CLR, "cut", "bmp_groove")
    p.cyl("y", 50.8, 115.9, -0.1, YB + 0.1, 1.9, "cut", "bmp_pin")
    # дно: проход кабелей, винты горловины; потолок: винты ручки
    p.box(-14, 14, -13, 3, Z0 - 1, IZ0 + 1, "cut", "cable_hole")
    for sx in (-1, 1):                       # бобышки верхней клипсы электрода на задней стенке
        p.cyl("y", sx * 16, 142, YBI - 6, YBI + 0.01, 9, "join", "clip_boss")
        p.cyl("y", sx * 16, 142, YB - INS_H, YB + 0.1, INS_D, "cut", "clip_insert")
    p.cyl("z", 25, 16.8, Z0 - 0.1, IZ0 + 0.1, 2.0 + 2 * CLR, "cut", "key_hole")     # ключ: горловина ставится только одной стороной
    for x, y in HEAD_SCREWS:
        p.cyl("z", x, y, Z0 - 0.1, IZ0 + 0.1, SCR, "cut", "head_screw")
        p.cyl("z", x, y, IZ0 - 1.2, IZ0 + 0.1, CB_D, "cut", "head_cb")
    for x, y in GRIP_SCREWS:
        p.cyl("z", x, y, IZ1 - 0.1, Z1 + 0.1, SCR, "cut", "grip_screw")
        p.cyl("z", x, y, IZ1 - 0.1, IZ1 + 1.2, CB_D, "cut", "grip_cb")
    return p


def build_lid():
    p = Part("2_Lid", "green")
    p.prism("y", LID_Y, YO, lambda d: d.rrect(-BX, Z0, BX, Z1, 6), "new", "Lid")
    for sx, zc in EARS:
        p.box(sx * 47, sx * 54, LID_Y, YO, zc - 4, zc + 4, "join", "ear")
    for sx in (-1, 1):                       # рёбра жёсткости вдоль длинных сторон
        p.box(sx * 43, sx * 44.6, YO - 0.01, -18.4, 62, 141, "join", "rib")
    for sx, zc in EARS:
        p.cyl("y", sx * 50.75, zc, LID_Y - 1, YO + 1, SCR, "cut", "screw")
    p.box(IX + CLR, BX, YO - 0.01, BNC_Y - 6.5, BNC_Z - 6.25 + CLR, BNC_Z + 6.25 - CLR, "join", "bnc_tab")   # заодно ключ: крышка не встанет перевёрнутой
    # изнутри: подушка держит ESP32 в гребёнках, стойка запирает перфоплату в направляющих
    p.box(-14, 2, YO - 0.01, -18.1 - CLR, 106, 118, "join", "esp_pad")
    p.cyl("y", 31 + CLR + 2.5, 119, YO - 0.01, DECK_Y0 - CLR, 5, "join", "perf_stop")
    # прорези к кнопкам EN и BOOT на ESP32 (по бокам от Type-C) — нажимать зубочисткой
    for zc in (103.0, 121.0):
        p.prism("y", LID_Y - 1, YO + 1, lambda d, zc=zc: d.rrect(-42.5, zc - 4, -38.5, zc + 4, 1.5), "cut", "button_slot")
    p.prism("y", LID_Y, LID_Y + 0.6, lambda d: d.text("pH  ·  EC  ·  ВЛАЖНОСТЬ  ·  T", 0, 70, 3.6, 84), "cut", "subtitle")
    return p


def deck_outline(d):
    a, z0, z1 = IX - CLR, IZ0 + CLR, IZ1 - CLR
    d.poly([(-a + 4, z0), (a - 4, z0), (a, z0 + 4), (a, z1 - 4),
            (a - 4, z1), (-a + 4, z1), (-a, z1 - 4), (-a, z0 + 4)])


def deck_common(p, y0, y1):
    """Общее для панели и рамки: вырезы под головки винтов ручки и штифты-центровки."""
    for sx in (-1, 1):
        p.box(sx * 30.4, sx * 37.6, y0, y1 + 1, 144, IZ1, "cut", "grip_head_relief")
        p.cyl("y", sx * 24, 139, y0 - 0.1, y1 + 0.1, 1.9, "cut", "locator_pin")


def build_deck():
    p = Part("3_Deck", "white")
    y0, y1 = DECK_Y0, DECK_Y1
    p.prism("y", y0, y1, deck_outline, "new", "Deck")
    for x, z in BOSSES:
        p.cyl("y", x, z, y0 - 0.1, y1 + 0.1, SCR, "cut", "hole")
    p.box(-14, -2, y0 - 1, y1 + 1, 96, 122, "cut", "wire_slot")
    p.box(-30, -20, y0 - 1, y1 + 1, 127, 134, "cut", "wire_slot2")
    for sx in (1, -1):                       # облегчение и проход проводов под платами pH и TDS
        p.box(sx * 8, sx * 36, y0 - 1, y1 + 1, 62, 84, "cut", "window")
    # перфоплата 50x70: вставляется справа в направляющие до упора
    p.box(-36, 33, -3.4, y0 + 0.01, 91.2, 94.8, "join", "rail_low")
    p.box(-37, 34, -2.4 - CLR, -0.8 + CLR, 94.0 - CLR, 94.81, "cut", "groove_low")
    p.box(-36, 33, -3.4, y0 + 0.01, 143.2, 146.0, "join", "rail_top")
    p.box(-37, 34, -2.4 - CLR, -0.8 + CLR, 143.19, 144.0 + CLR, "cut", "groove_top")
    p.box(-40.5, -39.0 - CLR, -2.4, y0 + 0.01, 96.9, 100, "join", "stop")
    # платы pH и TDS: въезжают в общий паз с краёв до центрального упора,
    # с внешней стороны их запирает стенка корпуса
    p.box(-40, 40, -3.0, y0 + 0.01, 57.0, 59.6, "join", "board_rail_low")
    p.box(-41, 41, -1.4 - CLR, 0.2 + CLR, 58.5 - CLR, 59.61, "cut", "board_groove_low")
    p.box(-37, 37, -3.0, y0 + 0.01, 89.4, 92.0, "join", "board_rail_top")
    p.box(-38, 38, -1.4 - CLR, 0.2 + CLR, 89.39, 90.5 + CLR, "cut", "board_groove_top")
    p.box(-2.5 + CLR, 3.5 - CLR, -3.0, y0 + 0.01, 57.0, 92.0, "join", "center_stop")   # pH 41 мм, TDS 42 мм
    deck_common(p, y0, y1)
    return p


def build_frame():
    """Прижимная рамка заднего яруса: стоит между панелью и стойками, держится теми же 4 винтами."""
    p = Part("10_Back_Frame", "white")
    y0, y1 = DECK_Y1, FRAME_Y1
    p.prism("y", y0, y1, deck_outline, "new", "Back frame")
    for x, z in BOSSES:
        p.cyl("y", x, z, y0 - 0.1, y1 + 0.1, SCR, "cut", "hole")
    p.box(-4, 45, y0 - 1, y1 + 1, 62, 89.5, "cut", "window_power")   # тумблер и провода
    p.box(-14, -2, y0 - 1, y1 + 1, 96, 122, "cut", "wire_slot")
    # упоры на кромки плат: давят только по краю 1.4 мм, где нет деталей
    tip = YBI - 3.2                                                # кромка платы минус зазор 0.1
    for x0, x1, z0, z1 in ((-34, -26, 98.1, 99.5), (-34, -26, 114.0, 115.4),
                           (-30, -22, 64.1, 65.5), (-30, -22, 80.0, 81.4)):
        p.box(x0, x1, y1 - 0.01, tip, z0, z1, "join", "press")
    # две пружинящие лапки на аккумулятор: допускают разбухание
    for zt in (104.0, 118.0):
        p.box(8, 40, y0 - 1, y1 + 1, zt - 1.5, zt, "cut", "spring_slot")
        p.box(8, 40, y0 - 1, y1 + 1, zt + 8, zt + 9.5, "cut", "spring_slot")
        p.box(38, 40, y0 - 1, y1 + 1, zt, zt + 8, "cut", "spring_end")
        p.box(30, 38, y1 - 0.01, 11.4, zt, zt + 8, "join", "spring_tip")
    deck_common(p, y0, y1)
    return p


def build_handle():
    """Широкое основание: винты у боковых стенок, нагрузка не гнёт потолок блока."""
    p = Part("4_Handle", "white")
    p.prism("y", -12, 12, lambda d: d.poly([(-38, Z1), (38, Z1), (38, 156), (15, 170), (15, 175.5),
                                            (-15, 175.5), (-15, 170), (-38, 156)]), "new", "Handle")
    p.prism("y", -12, 12, lambda d: d.rrect(-60, 175, 60, 199, 10), "join", "bar")
    for sy in (-1, 1):                       # фаски на рукояти
        for zc, sz in ((199.0, -1), (175.0, 1)):
            p.prism("x", -61, 61, lambda d, sy=sy, zc=zc, sz=sz: d.poly(
                [(sy * 12.5, zc - sz * 0.5), (sy * 12.5, zc + sz * 4), (sy * 8, zc - sz * 0.5)]), "cut", "chamfer")
    # облегчение: рукоять и стойка пустые внутри, стенка 4 мм
    p.prism("y", -8, 8, lambda d: d.rrect(-52, 179, 52, 195, 6), "cut", "hollow_bar")
    p.box(-11, 11, -8, 8, 153, 179.5, "cut", "hollow_post")
    for x, y in GRIP_SCREWS:
        p.cyl("z", x, y, Z1 - 0.1, Z1 + INS_H, INS_D, "cut", "insert")
    return p


def build_head():
    p = Part("5_Sensor_Head", "graphite")
    p.prism("z", 0, 3.2, lambda d: d.rrect(-60, -35, 60, 35, 10), "new", "Sensor head")
    p.prism("z", 3.1, Z0, lambda d: d.rrect(-44, -18, 44, 18, 6), "join", "collar")
    p.prism("z", 3, Z0 + 0.1, lambda d: d.rrect(-41.6, -15.6, 41.6, 15.6, 3.6), "cut", "cavity")
    p.cyl("z", 25, 16.8, Z0 - 0.1, Z0 + 1.6, 2.0, "join", "key_peg")
    # юбка тонкая (3.2 мм), жёсткость дают рёбра
    for x in (-40, -22, 22, 40):
        for s in (1, -1):
            p.box(x - 1.2, x + 1.2, s * 17, s * 33, 3.1, 11, "join", "rib")
    for s in (1, -1):
        p.box(s * 43, s * 58, -1.2, 1.2, 3.1, 11, "join", "rib")
    for x, y in HEAD_SCREWS:                 # колонны со вставками, на них стоит блок
        sy = 1 if y > 0 else -1
        p.box(x - 4, x + 4, sy * 8.5, sy * 16.5, 2.9, Z0, "join", "column")
        p.cyl("z", x, y, Z0 - INS_H, Z0 + 0.1, INS_D, "cut", "insert")
    # площадки под винты клипсы электрода (снизу скос 45° — печать без поддержек)
    for sx in (-1, 1):
        p.prism("x", sx * 12, sx * 20, lambda d: d.poly([(15.7, 27), (15.7, 44), (9, 44), (9, 34)]), "join", "clip_pad")
        p.cyl("y", sx * 16, 39, 10, 18.1, INS_D, "cut", "clip_insert")
    # отверстия в дне
    p.box(-16 - CLR, 16 + CLR, -3 - CLR, 3 + CLR, -1, 3.1, "cut", "blade_slot")
    p.cyl("z", DS_X, 0, -1, 3.1, 11 + 2 * CLR, "cut", "ds_guard_hole")
    p.cyl("z", 32, 0, -1, 3.1, 13.2 + 2 * CLR, "cut", "tds_hole")
    # неподвижная половина зажима; подвижных части три, у каждой свои винты
    p.box(-41, 41, -8, 0, 2.9, JAW_Z, "join", "jaw")
    cut_ds_seat(p); cut_tds_seat(p); cut_center_seats(p, -1)
    for sx in (-1, 1):
        p.box(sx * 38.95, sx * 40.8, -1.4, 0.01, 2.8, JAW_Z + 0.1, "cut", "hinge_seat")
    for x, z in CLAMP_SCREWS:
        p.cyl("y", x, z, -8.1, -3, INS_D, "cut", "jaw_insert")
        p.cyl("y", x, z, 15, 19, 7, "cut", "tool_access")                # доступ отвёрткой сзади
    return p


def cut_ds_seat(p):
    p.cyl("z", DS_X, 0, 2.5, 12.0 + CLR, 13.5 + 2 * CLR, "cut", "ds_guard_collar")     # буртик штатива DS18B20
    p.cyl("z", DS_X, 0, 12, JAW_Z + 0.1, 3.6, "cut", "ds_cable")       # кабель зажат выше штатива


def cut_tds_seat(p):
    p.cyl("z", 32, 0, 2.5, JAW_Z + 0.1, 13.2, "cut", "tds_body")       # шарнирная губка зажмёт Ø11.7–13.2


def cut_center_seats(p, side):
    """Плата лежит свободно (±1.0), зажимаются только ушки вилки."""
    p.box(-11.7, 11.7, side * 1.0, -side * 0.01, 2.5, JAW_Z + 0.1, "cut", "moist_seat")
    for sx in (-1, 1):
        p.box(sx * (12.4 - CLR), sx * (16 + CLR), side * 3.1, -side * 0.01, 2.5, JAW_Z + 0.1, "cut", "rail_seat")
        p.box(sx * 16.1, sx * 19.9, side * 3.1, -side * 0.01, 2.5, 22.2, "cut", "ear_seat")


def clamp_screw(p, x, z):
    p.cyl("y", x, z, 0, 9, SCR, "cut", "screw")
    p.cyl("y", x, z, 6, 9, CB_D, "cut", "cbore")


def build_clamp():
    p = Part("8a_Clamp_Center", "graphite")
    p.box(-20.0, 20.0, 0.5, 8, 3.2, JAW_Z, "new", "Clamp center")
    cut_center_seats(p, 1)
    p.box(-8.5, 8.5, 0.4, 8.1, 6.0, JAW_Z + 0.1, "cut", "parts_relief")  # окно под детали датчика (до 9 мм), снизу перемычка — губка цельная
    for sx in (-1, 1):
        clamp_screw(p, sx * 16, 13)
    return p


def build_clamp_side(side):
    """Боковая губка на шарнире: внешний край упирается в паз, винт прижимает внутренний."""
    name = "8b_Clamp_DS" if side < 0 else "8c_Clamp_TDS"
    p = Part(name, "graphite")
    y0 = 0.5 if side < 0 else 1.5            # губке TDS оставлен ход 1.5 мм — зажмёт любой диаметр 11.7–13.2
    p.box(side * 21, side * 41, y0, 8, 3.2, JAW_Z, "new", name)
    p.box(side * 39.1, side * 40.4, -1.0, y0 + 0.1, 3.2, JAW_Z, "join", "hinge")
    if side < 0:
        cut_ds_seat(p)
        clamp_screw(p, -24, 16)
    else:
        cut_tds_seat(p)
        clamp_screw(p, 23.5, 16)
    return p


def build_ds_guard():
    """Мини-штатив DS18B20: гильза сидит внутри, почва касается её через 4 окна."""
    p = Part("11_DS_Guard", "graphite")
    p.cyl("z", DS_X, 0, -40, 3.05, 11, "new", "DS guard")
    p.cyl("z", DS_X, 0, 3, 12, 13.5, "join", "collar")
    p.cyl("z", DS_X, 0, -41, 4, 6 + 2 * CLR, "cut", "bore")
    p.cyl("z", DS_X, 0, 3.9, 12.1, 4 + 2 * CLR, "cut", "cable_hole")
    for z0, z1 in ((-36, -22), (-18, -4)):      # 2 окна на сторону, между ними кольцо — ножки не ломаются
        p.box(DS_X - 1.75, DS_X + 1.75, -6, 6, z0, z1, "cut", "window")
    return p


def electrode_ring(p, z0, z1, d, base_y0, base_y1, screw_z):
    ro = d / 2 + CLR + 2.6
    p.box(-20, 20, base_y0, base_y1, z0, z1, "new", p.name)
    p.box(-4, 4, base_y1 - 0.1, ELECTRODE_Y - ro + 1, z0, z1, "join", "neck")
    p.cyl("z", 0, ELECTRODE_Y, z0, z1, 2 * ro, "join", "ring")
    p.cyl("z", 0, ELECTRODE_Y, z0 - 1, z1 + 1, d + 2 * CLR, "cut", "bore")
    p.box(-0.4 * d, 0.4 * d, ELECTRODE_Y + 2, ELECTRODE_Y + ro + 2, z0 - 1, z1 + 1, "cut", "snap_opening")
    for sx in (-1, 1):
        p.cyl("y", sx * 16, screw_z, base_y0 - 0.1, base_y1 + 0.1, SCR, "cut", "screw")


def build_electrode_clip():
    """Нижний держатель: обхватывает колпачок, стоит на горловине."""
    p = Part("12_Electrode_Cap_Holder", "white")
    electrode_ring(p, 28.0, 50.0, ELECTRODE_CAP_D, 18.0, 22.0, 39.0)
    return p


def build_electrode_clip_top():
    """Верхняя клипса: держит корпус электрода, стоит на задней стенке блока."""
    p = Part("13_Electrode_Clip", "white")
    electrode_ring(p, 136.0, 148.0, ELECTRODE_D, YB, YB + 2.0, 142.0)
    return p


def build_fork():
    """Плата закрыта между перемычкой снизу и зубьями сверху, ушки зажаты и лежат на дне."""
    p = Part("6_Blade_Guard", "graphite")
    p.prism("y", -3, 3, lambda d: d.poly([
        (8, 35.1), (16, 35.1), (16, 22), (19.6, 22), (19.6, 3), (16, 3), (16, -68), (0, -72),
        (-16, -68), (-16, 3), (-19.6, 3), (-19.6, 22), (-16, 22), (-16, 35.1), (-8, 35.1), (-8, 32.3),
        (-12.4, 32.3), (-12.4, -66.8), (12.4, -66.8), (12.4, 32.3), (8, 32.3)]), "new", "Blade guard")
    for sx in (-1, 1):                       # винт зажима проходит сквозь ушко вилки
        p.cyl("y", sx * 16, 13, -4, 4, SCR, "cut", "screw")
    return p


def build_cap():
    p = Part("7_Cap", "white")
    p.prism("z", -79.6, 0, lambda d: d.rrect(-41.6, -9.6, 41.6, 9.6, 3), "new", "Cap")
    p.prism("z", -78, 0.1, lambda d: d.rrect(-40, -8, 40, 8, 1.6), "cut", "inside")
    for sx in (-1, 1):                       # рёбра держат колпачок на вилке
        for sy in (-1, 1):
            p.box(sx * 12.4, sx * 16, sy * 3.1, sy * 8.1, -78.1, -25, "join", "rib")
    return p


def build_plug(which):
    """Заглушки окон Type-C (вставляются на трении)."""
    if which == "tp":
        p = Part("16_Plug_TypeC_Charge", "white")
        y, z, h, w = 16.9, 106.75, 8.5, 13.5
        p.prism("x", -IX - 0.3, -BX, lambda d: d.rrect(y - h / 2 + 0.15, z - w / 2 + 0.15, y + h / 2 - 0.15, z + w / 2 - 0.15, 2.85), "new", p.name)
        p.prism("x", -BX, -BX - 1.5, lambda d: d.rrect(y - h / 2 - 1, z - w / 2 - 1, y + h / 2 + 1, z + w / 2 + 1, 3), "join", "flange")
    else:
        p = Part("17_Plug_TypeC_ESP32", "white")
        p.box(-IX - 0.3, -BX, YO + 0.15, -12.5, 104.65, 119.35, "new", p.name)
        p.box(-BX, -BX - 1.5, YO - 1, -11.35, 103.5, 120.5, "join", "flange")
    # язычок в плоскости фланца (печать фланцем на стол, без поддержек)
    yc, ztop = (16.9, 114.5) if which == "tp" else (-16.6, 120.5)
    p.box(-BX, -BX - 1.5, yc - 2.5, yc + 2.5, ztop - 0.1, ztop + 6, "join", "pull_tab")
    return p


def build_modules():
    p = Part("9_Modules (макеты, не печатать)", "pcb_blue")
    B = lambda name, c, *xyz: p.box(*xyz, op="new", tag=name, color=c)
    # задний ярус
    B("Battery 103450", "yellow", IX - CLR - BAT_L, IX - CLR, 11.6, 21.6, 114.75 - BAT_W / 2, 114.75 + BAT_W / 2)
    B("TP4056", "pcb_blue", -44.4, -16.2, 18.5, 20.1, 98, 115.5)
    B("TP4056 USB-C", "steel", -44.7, -37.4, 15.3, 18.5, 102.25, 111.25)
    B("MT3608", "pcb_blue", -44.1, -7.1, 18.5, 20.1, 64, 81.5)
    B("MT3608 trim", "navy", -41, -36, 13.6, 18.5, 66, 76)
    B("MT3608 coil", "black", -26, -19, 14.5, 18.5, 69, 76)
    B("KCD1 body", "black", 27.5, 47.4, 7, 20, 68.1, 87.1)
    B("KCD1 bezel", "black", 47.5, 50, 6, 21, 67, 88.2)
    # передний ярус
    B("Perfboard 5x7", "pcb_green", -39, 31, -2.4, -0.8, 94, 144)
    for zr in (99.3, 124.7):
        B("Female header", "black", -36.45, 1.65, -10.9, -2.4, zr - 1.25, zr + 1.25)
        B("Male header", "black", -36.45, 1.65, -13.4, -10.9, zr - 1.25, zr + 1.25)
    B("ESP32 DevKit", "black", -43.4, 8.6, -15.0, -13.4, 98, 126)
    B("ESP32 module", "steel", -17.0, 8.6, -18.1, -15.0, 103, 121)
    B("ESP32 USB-C", "steel", -44.9, -37.4, -18.2, -15.0, 106.5, 117.5)
    for x in (-33, -22, -11, 0, 11):
        B("JST-XH", "ivory", x, x + 8.5, -9.4, -2.4, 130, 136)
    p.cyl("y", 20, 112, -14.4, -2.4, 8, "new", "Cap 470uF", "navy")
    B("pH-4502C", "pcb_blue", 3.5, 44.5, -1.4, 0.2, 58.5, 90.5)
    B("BNC", "steel", 33.5, 44.5, BNC_Y - 6.1, BNC_Y + 6.5, BNC_Z - 6, BNC_Z + 6)
    p.cyl("x", BNC_Y, BNC_Z, 44.5, 64.5, 9.6, "new", "BNC barrel", "steel")   # замер: 61 мм с платой
    B("pH pot", "navy", 8, 18, -11.4, -1.4, 62, 72)
    B("TDS v1.0", "pcb_blue", -44.5, -2.5, -1.4, 0.2, 58.5, 90.5)
    B("TDS conn", "ivory", -40, -32, -7.4, -1.4, 64, 72)
    B("BMP280", "purple", 50, 51.6, 6.25, 17.25, 117, 132)
    # датчики
    B("Soil moisture v1.2", "red", -11.5, 11.5, -0.5, 0.5, -66.5, 32)    # замер: 98.5 x 23 x 1
    B("Moisture parts", "black", -7.5, 7.5, 0.5, 9.5, 6.5, 31)           # замер: детали с разъёмом 9 мм
    p.cyl("z", DS_X, 0, -47, 4, 6, "new", "DS18B20", "steel")             # замер: 6 x 51
    p.cyl("z", 0, ELECTRODE_Y, 3.2, 3.2 + ELECTRODE_CAP_L, ELECTRODE_CAP_D, "new", "pH electrode cap", "ivory")
    p.cyl("z", 0, ELECTRODE_Y, 3.2 + ELECTRODE_CAP_L, 3.2 + ELECTRODE_L, ELECTRODE_D, "new", "pH electrode", "ivory")
    p.cyl("z", 32, 0, 0, 44, TDS_D, "new", "TDS probe", "black")           # замер: 44 без игл
    for x in (30.5, 33.5):
        p.cyl("z", x, 0, -6, 0, 1.5, "new", "TDS needle", "steel")          # замер: иглы 6 мм
    return p


STEPS = [("body", build_body), ("lid", build_lid), ("deck", build_deck), ("frame", build_frame), ("handle", build_handle),
         ("head", build_head), ("fork", build_fork), ("clamp", build_clamp), ("clamp_ds", lambda: build_clamp_side(-1)), ("clamp_tds", lambda: build_clamp_side(1)),
         ("ds_guard", build_ds_guard), ("electrode_clip", build_electrode_clip), ("electrode_clip_top", build_electrode_clip_top), ("cap", build_cap), ("plug_tp", lambda: build_plug("tp")), ("plug_esp", lambda: build_plug("esp")), ("modules", build_modules)]
PRINTED = ["body", "lid", "deck", "frame", "handle", "head", "fork", "clamp", "clamp_ds", "clamp_tds", "ds_guard", "electrode_clip", "electrode_clip_top", "cap", "plug_tp", "plug_esp"]
JOINTS = [("lid", "body"), ("deck", "body"), ("frame", "body"), ("handle", "body"), ("head", "body"),
          ("fork", "head"), ("clamp", "head"), ("clamp_ds", "head"), ("clamp_tds", "head"), ("ds_guard", "head"), ("electrode_clip", "head"), ("electrode_clip_top", "body"), ("plug_tp", "body"), ("plug_esp", "body"), ("cap", "head"), ("modules", "deck")]


# =============================================================================
#  Сборка, проверки, экспорт
# =============================================================================
def joints(parts):
    try:
        parts["body"].occ.isGrounded = True
        n = 0
        for a, b in JOINTS:
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
            if p.comp.bRepBodies.count != 1:     # деталь распалась на куски — в STL ушла бы только часть
                FAILS.append("%s: тел %d вместо 1" % (p.name, p.comp.bRepBodies.count))
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
    no_cap = [k for k in parts if k != "cap"]
    snap("1_iso.png", ISO, set(no_cap))
    snap("2_front.png", (0, -1, 0.05), set(no_cap))
    snap("3_open.png", ISO, {"body", "deck", "frame", "handle", "head", "fork", "clamp", "clamp_ds", "clamp_tds", "ds_guard", "electrode_clip", "electrode_clip_top", "modules"})
    snap("4_no_deck.png", (0.3, -1, 0.4), {"body", "handle"})
    snap("5_bottom.png", (0.4, -0.7, -1), {"body", "lid", "handle", "head", "fork", "ds_guard", "electrode_clip", "electrode_clip_top"})
    snap("6_left_ports.png", (-1, -0.4, 0.2), {"body", "lid", "handle", "head", "fork", "ds_guard", "electrode_clip", "electrode_clip_top"})
    snap("7_right_ports.png", (1, -0.4, 0.2), {"body", "lid", "handle", "head", "fork", "ds_guard", "electrode_clip", "electrode_clip_top"})
    snap("8_cap.png", (1, -1.4, -0.5), {"body", "lid", "handle", "head", "cap"})
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
    prog.show("SoilPlus", "Строю: %v из %m", 0, 20, 0)
    steps = STEPS
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
    prog.progressValue = 17
    adsk.doEvents()
    joints(parts)
    clashes = interference(parts)
    prog.progressValue = 18
    prog.message = "Экспорт"
    adsk.doEvents()
    printed = PRINTED
    sizes = export(parts, printed)
    prog.progressValue = 19
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
