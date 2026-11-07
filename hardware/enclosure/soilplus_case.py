#!/usr/bin/env python3
"""
SoilPlus — корпус «колышек» (вариант В, укладка 1+2: выдвижной двухъярусный лоток).

Запуск:  python soilplus_case.py           -> собирает модель, проверяет зазоры, пишет файлы в out/
Нужен build123d (pip install build123d).

Система координат сборки (мм):
  x — влево/вправо (0 = центр головы), y — вглубь от передней панели (0 = плоскость фланца),
  z — вверх (0 = дно головы). Колышек уходит в минус по z, земля на z = GROUND_Z.

РАЗМЕРЫ МОДУЛЕЙ — ТИПОВЫЕ (штангенциркуля не было). Всё, что зависит от конкретной платы,
вынесено в блок «Модули» ниже: поменяй число и перезапусти скрипт.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from build123d import (
    Align, Box, Color, Compound, Cone, Cylinder, Pos, RectangleRounded, Rot,
    Solid, Text, Wire, export_gltf, export_step, export_stl, extrude,
)

OUT = Path(__file__).resolve().parent / "out"
MIN3 = (Align.MIN, Align.MIN, Align.MIN)

# ============================================================================
#  Параметры
# ============================================================================
# --- печать / крепёж
WALL = 2.4            # стенки головы (6 периметров по 0.4)
INSERT_D = 4.0        # отверстие под латунную вставку M3 (проверь по своей вставке)
INSERT_DEPTH = 6.0
SCREW_D = 3.4         # проход винта M3
CSK_D = 6.6           # потай M3 (DIN 7991)

# --- лоток (выдвижной, 2 яруса)
TRAY_X = 54.0         # полуширина лотка (ширина 108)
TRAY_D = 80.0         # глубина лотка
FLOOR_T = 2.4
H1 = 20.0             # высота 1-го яруса (питание)
DECK_T = 2.4
H2 = 28.0             # высота 2-го яруса (ESP32, pH, TDS)
SLIDE = 0.4           # зазор лотка по бокам
BAY = 16.0            # кабельный отсек за лотком

# --- голова (производные)
IX = TRAY_X + SLIDE                          # 54.4  внутренняя полуширина
IN_D = TRAY_D + BAY                          # 96    внутренняя глубина
IZ0 = WALL                                   # 2.4   верх пола головы
IZ1 = IZ0 + FLOOR_T + H1 + DECK_T + H2       # 55.2  потолок
OX = IX + WALL                               # 56.8
OD = IN_D + WALL                             # 98.4
OH = IZ1 + WALL                              # 57.6
FL = 6.0                                     # вынос фланца
FX = OX + FL                                 # 62.8
FZ0, FZ1 = IZ0, OH + FL                      # 2.4 .. 63.6  (низ без фланца)
FL_T = 4.0                                   # толщина фланца до фаски

# лоток в координатах головы
TZ0 = IZ0                     # низ пола лотка
TZ1 = TZ0 + FLOOR_T           # 4.8  верх пола лотка (1 ярус)
DZ0 = TZ1 + H1                # 24.8 низ палубы
DZ1 = DZ0 + DECK_T            # 27.2 верх палубы (2 ярус)
PLATE_T = 3.0

POSTS = [(sx * 50.5, sy) for sx in (-1, 1) for sy in (4.5, TRAY_D - 3.5)]
FLANGE_INSERTS = [(sx * (OX + FL / 2), z) for sx in (-1, 1) for z in (12.0, 50.0)]

# --- колышек
SY = 78.0                     # ось колышка по y (под кабельным отсеком)
STAKE_X, STAKE_Y = 26.0, 16.0  # полуразмеры ствола 52 x 32
FLANGE_SX, FLANGE_SY, FLANGE_T = 30.0, 20.0, 6.0
STAKE_BOTTOM = -71.0
GROUND_Z = -41.0              # уровень земли
STAKE_SCREWS = [(sx * 25.0, SY + sy) for sx in (-1, 1) for sy in (-16.0, 16.0)]

# --- Модули (типовые размеры; ДЛ x ШИР x ВЫС)
ESP_L, ESP_W = 51.5, 28.5     # ESP32 DevKit 30 pin, Type-C CH340C
PERF_L, PERF_W = 70.0, 50.0   # перфоплата 5x7
TP_L, TP_W = 28.0, 17.5       # TP4056 Type-C с защитой
MT_L, MT_W = 36.0, 17.0       # MT3608
D41_L, D41_W = 35.0, 16.0     # D4184 (у разных продавцов 23..35 мм)
BRD_L, BRD_W = 42.0, 32.0     # платы TDS v1.0 и pH-4502C
BAT = (50.0, 34.0, 10.0)      # 103450
KCD1_CUT = (19.2, 13.2)       # вырез под тумблер KCD1 (бывает 21x15 — проверь)
BNC_HOLE = 12.5
USB_HOLE = (13.5, 8.5)        # окно под штекер Type-C (под литой корпус кабеля)
TUBE_OD = 8.0                 # силиконовая трубка 6x8 (подбирать под насос)
TDS_PROBE_D = 12.0            # щуп TDS — диаметр не нашёл в паспорте, проверить
DS_PROBE_D = 6.0


# ============================================================================
#  Примитивы
# ============================================================================
def B(x0, x1, y0, y1, z0, z1):
    x0, x1 = sorted((x0, x1))
    y0, y1 = sorted((y0, y1))
    z0, z1 = sorted((z0, z1))
    return Pos(x0, y0, z0) * Box(x1 - x0, y1 - y0, z1 - z0, align=MIN3)


def Cz(x, y, z0, z1, d):
    return Pos(x, y, z0) * Cylinder(d / 2, z1 - z0, align=(Align.CENTER, Align.CENTER, Align.MIN))


def Cy(x, z, y0, y1, d):
    return Pos(x, (y0 + y1) / 2, z) * Rot(90, 0, 0) * Cylinder(d / 2, y1 - y0)


def Cx(y, z, x0, x1, d):
    return Pos((x0 + x1) / 2, y, z) * Rot(0, 90, 0) * Cylinder(d / 2, x1 - x0)


def slot_y(x, z, y0, y1, w, h, r):
    """Скруглённое окно (w по x, h по z) насквозь по y от y0 до y1."""
    s = extrude(RectangleRounded(w, h, r), amount=y1 - y0)
    return Pos(x, y1, z) * Rot(90, 0, 0) * s


def csk_down(x, y, z_top, through_to):
    """Отверстие под потайной M3 сверху вниз."""
    h = (CSK_D - SCREW_D) / 2
    return (Cz(x, y, through_to, z_top + 0.1, SCREW_D)
            + Pos(x, y, z_top - h) * Cone(SCREW_D / 2, CSK_D / 2, h, align=(Align.CENTER, Align.CENTER, Align.MIN))
            + Cz(x, y, z_top - 0.01, z_top + 1, CSK_D))


def engrave(text, x, z, size, y_face, depth=0.6):
    t = extrude(Text(text, font_size=size), amount=depth)
    return Pos(x, y_face + depth, z) * Rot(90, 0, 0) * t


def pocket(x0, x1, y0, y1, h, z, front_open=False, wall=1.2):
    yo = y0 if front_open else y0 - wall
    outer = B(x0 - wall, x1 + wall, yo, y1 + wall, z, z + h)
    inner = B(x0, x1, y0 - (2 if front_open else 0), y1, z - 0.1, z + h + 1)
    return outer - inner


def pads_long(x0, x1, y0, y1, z, h=1.5, w=1.5, along="x"):
    """Две опорные полоски под длинными краями платы (снизу пайка)."""
    if along == "x":
        return B(x0, x1, y0, y0 + w, z, z + h) + B(x0, x1, y1 - w, y1, z, z + h)
    return B(x0, x0 + w, y0, y1, z, z + h) + B(x1 - w, x1, y0, y1, z, z + h)


def pads_corner(x0, x1, y0, y1, z, h=3.0, s=4.0):
    return (B(x0, x0 + s, y0, y0 + s, z, z + h) + B(x1 - s, x1, y0, y0 + s, z, z + h)
            + B(x0, x0 + s, y1 - s, y1, z, z + h) + B(x1 - s, x1, y1 - s, y1, z, z + h))


# ============================================================================
#  Печатные детали
# ============================================================================
def make_shell():
    s = B(-OX, OX, 0, OD, 0, OH)
    # фланец спереди + фаска 45° (печать задней стенкой на столе — без поддержек)
    s += B(-FX, FX, 0, FL_T, FZ0, FZ1)
    w1 = Wire.make_polygon([(-FX, FL_T, FZ0), (FX, FL_T, FZ0), (FX, FL_T, FZ1), (-FX, FL_T, FZ1)], close=True)
    w2 = Wire.make_polygon([(-OX, FL_T + FL, FZ0), (OX, FL_T + FL, FZ0), (OX, FL_T + FL, OH), (-OX, FL_T + FL, OH)], close=True)
    s += Solid.make_loft([w1, w2], ruled=True)
    # внутренность
    s -= B(-IX, IX, -1, IN_D, IZ0, IZ1)
    # вставки M3 во фланце (крепят переднюю панель лотка)
    for x, z in FLANGE_INSERTS:
        s -= Cy(x, z, -1, INSERT_DEPTH, INSERT_D)
    # крепление колышка: потайные винты изнутри, головки вровень с полом
    for x, y in STAKE_SCREWS:
        s -= csk_down(x, y, IZ0, -1)
    # проход кабелей из колышка в кабельный отсек
    s -= B(-8, 8, SY + 3, SY + 13, -1, IZ0 + 1)
    # карман BMP280 снаружи на левой стенке, открыт снизу, жалюзи сбоку
    s += B(-OX - 12, -OX, 72, OD, 10, 40)
    s -= B(-OX - 9.6, -OX, 74.4, OD - WALL, 9, 37.6)
    for z in (16, 21, 26, 31):
        s -= B(-OX - 13, -OX - 9, 78, 92, z - 1, z + 1)
    s -= Cx(85, 32, -OX - 3, -IX + 1, 5)   # провод BMP280 внутрь
    return s


def make_tray():
    t = B(-TRAY_X, TRAY_X, 0, TRAY_D, TZ0, TZ1)
    # передняя панель
    plate = B(-FX, FX, -PLATE_T, 0, FZ0, FZ1)
    # окна
    plate -= slot_y(-27.0, 47.0, -PLATE_T - 1, 1, *USB_HOLE, 3)          # ESP32 Type-C
    plate -= slot_y(-12.0, 9.5, -PLATE_T - 1, 1, USB_HOLE[0], 8.0, 3)     # TP4056 Type-C
    plate -= B(-35 - KCD1_CUT[0] / 2, -35 + KCD1_CUT[0] / 2, -PLATE_T - 1, 1,
               14.8 - KCD1_CUT[1] / 2, 14.8 + KCD1_CUT[1] / 2)            # тумблер
    plate -= Cy(20.0, 38.3, -PLATE_T - 1, 1, BNC_HOLE)                    # BNC pH
    for x, z in FLANGE_INSERTS:
        plate -= Cy(x, z, -PLATE_T - 1, 1, SCREW_D)
    # канавка под уплотнительный шнур (П-образная)
    g = (B(-57.5, -55.5, -1.2, 0.01, FZ0 - 1, 58.5) + B(55.5, 57.5, -1.2, 0.01, FZ0 - 1, 58.5)
         + B(-57.5, 57.5, -1.2, 0.01, 56.5, 58.5))
    plate -= g
    # надписи
    for txt, x, z, sz in (("SoilPlus", 36, 20, 8), ("pH", 20, 47.5, 5), ("USB", -27, 54.5, 3.5),
                          ("CHARGE", -12, 16, 3), ("ON", -35, 24.5, 3.5)):
        plate -= engrave(txt, x, z, sz, -PLATE_T)
    t += plate
    # буртик, входит в проём головы (бока и верх)
    lx, lz = IX - 0.3, IZ1 - 0.3
    t += B(-lx, lx, 0, 3, FZ0, lz) - B(-lx + 1.6, lx - 1.6, -1, 4, FZ0 - 1, lz - 1.6)
    # стойки палубы со вставками M3
    for x, y in POSTS:
        t += B(x - 3.5, x + 3.5, y - 3.5, y + 3.5, TZ1, DZ0)
        t -= Cz(x, y, DZ0 - INSERT_DEPTH, DZ0 + 0.1, INSERT_D)
    # --- ярус 1: питание
    t += pocket(-21.1, -2.9, 0, 29.0, 4, TZ1, front_open=True)                 # TP4056
    t += pads_long(-21.1, -2.9, 0.5, 28.5, TZ1, along="y")
    t += pocket(-45.2, 6.8, 37.2, 72.2, 6, TZ1)                                # аккумулятор
    for y in (11.7, 32.7):                                                     # 2 x MT3608
        t += pocket(11.2, 48.2, y - 1.5, y + 16.5, 3, TZ1)
        t += pads_long(11.2, 48.2, y - 1.5, y + 16.5, TZ1)
    t += pocket(10.9, 46.9, 52.2, 70.2, 3, TZ1)                                # D4184
    t += pads_long(10.9, 46.9, 52.2, 70.2, TZ1)
    # прорези под стяжку аккумулятора + канавка снизу, чтобы стяжка не тёрлась
    for x in (-30.0, -10.0):
        t -= B(x - 2, x + 2, 33.8, 35.8, TZ0 - 1, TZ1 + 1)
        t -= B(x - 2, x + 2, 74.0, 76.0, TZ0 - 1, TZ1 + 1)
        t -= B(x - 2, x + 2, 33.8, 76.0, TZ0 - 1, TZ0 + 1.2)
    return t


def make_deck():
    d = B(-TRAY_X, TRAY_X, 0.4, TRAY_D, DZ0, DZ1)
    for sx in (-1, 1):                                    # обход буртика передней панели
        d -= B(sx * 52.3, sx * 60, -1, 3.3, DZ0 - 1, DZ1 + 1)
    for x, y in POSTS:
        d -= csk_down(x, y, DZ1, DZ0 - 1)
    # направляющие перфоплаты 50x70 (вставляется сзади, упор спереди)
    d += B(-54, -51, 9, 69, DZ1, DZ1 + 7.5)
    d -= B(-52.3, -50.99, 8, 70, DZ1 + 4, DZ1 + 5.9)
    d += B(-3, 0, 0.4, 76, DZ1, DZ1 + 7.5)
    d -= B(-3.01, -1.7, 1.99, 77, DZ1 + 4, DZ1 + 5.9)
    d += B(-10, -3, 0.4, 2.0, DZ1, DZ1 + 7.5)             # упор
    # pH-4502C (BNC вперёд, в панель) и TDS v1.0
    d += pocket(3.5, 36.5, 0.4, 43.4, 5, DZ1, front_open=True)
    d += pads_corner(3.5, 36.5, 0.4, 43.4, DZ1)
    d += pocket(3.5, 46.5, 45.8, 78.8, 5, DZ1)
    d += pads_corner(3.5, 46.5, 45.8, 78.8, DZ1)
    # проходы проводов между ярусами
    d -= B(39, 46, 10, 40, DZ0 - 1, DZ1 + 1)
    d -= B(-40, -14, 73.5, 79, DZ0 - 1, DZ1 + 1)
    d -= B(-46, -36, 20, 50, DZ0 - 1, DZ1 + 1)
    return d


def make_stake():
    st = B(-FLANGE_SX, FLANGE_SX, SY - FLANGE_SY, SY + FLANGE_SY, -FLANGE_T, 0)
    st += B(-STAKE_X, STAKE_X, SY - STAKE_Y, SY + STAKE_Y, STAKE_BOTTOM, -FLANGE_T)
    # бобышки стяжных винтов (до полости)
    bosses = [(sx * 22.0, z) for sx in (-1, 1) for z in (-12.0, -28.0)]
    cav = B(-STAKE_X + WALL, STAKE_X - WALL, SY - STAKE_Y + WALL, SY + STAKE_Y - WALL, STAKE_BOTTOM + 6, -FLANGE_T)
    for x, z in bosses:
        cav -= Cy(x, z, SY - STAKE_Y, SY + STAKE_Y, 8)
    st -= cav
    st -= B(-8, 8, SY + 3, SY + 13, -FLANGE_T - 1, 1)                     # кабели вверх
    for x, y in STAKE_SCREWS:                                               # вставки во фланец
        st -= Cz(x, y, -5, 0.1, INSERT_D)
    # дно: щель датчика влажности, щуп TDS, DS18B20, гнездо иглы полива
    zb0, zb1 = STAKE_BOTTOM - 1, STAKE_BOTTOM + 7
    st -= B(-22.5, 1.5, SY - 1.1, SY + 1.1, zb0, zb1)
    st -= Cz(12, SY, zb0, zb1, TDS_PROBE_D + 0.5)
    st -= Cz(-10, SY - 7.5, zb0, zb1, DS_PROBE_D + 0.4)
    st -= Cz(-10, SY + 7.5, zb0, zb1, 10.4)
    # вход воды сзади (над землёй)
    st -= Cy(-10, -20, SY, SY + STAKE_Y + 1, TUBE_OD + 0.4)
    # штифты-направляющие (кусок филамента 1.75 не подойдёт — нужен пруток/гвоздь 3 мм)
    for x, z in ((-15, -3), (15, -3), (22, -68)):
        st -= Cy(x, z, SY - 4, SY + 4, 3.1)
    # риска уровня земли
    st -= (B(-STAKE_X - 1, STAKE_X + 1, SY - STAKE_Y - 1, SY + STAKE_Y + 1, GROUND_Z - 0.5, GROUND_Z + 0.5)
           - B(-STAKE_X + 0.6, STAKE_X - 0.6, SY - STAKE_Y + 0.6, SY + STAKE_Y - 0.6, GROUND_Z - 1, GROUND_Z + 1))
    # стяжные винты: спереди проход + потай под головку, сзади вставка
    front = st & B(-40, 40, SY - 30, SY, -200, 10)
    back = st & B(-40, 40, SY, SY + 30, -200, 10)
    for x, z in bosses:
        front -= Cy(x, z, SY - STAKE_Y - 1, SY + 0.1, SCREW_D)
        front -= Cy(x, z, SY - STAKE_Y - 1, SY - STAKE_Y + 6, 6.2)
        back -= Cy(x, z, SY - 0.1, SY + INSERT_DEPTH, INSERT_D)
    return front, back


def make_spike():
    cx, cy = -10.0, SY + 7.5
    c = (Align.CENTER, Align.CENTER, Align.MIN)
    sp = Cz(cx, cy, -161, -63, 10)
    sp += Pos(cx, cy, -171) * Cone(0.6, 5, 10, align=c)               # остриё
    sp += Cz(cx, cy, -65, -63, 12)                                     # буртик (лежит на дне ствола)
    sp += Pos(cx, cy, -63) * Cone(6, 2.7, 3.3, align=c)                # фаска 45° — печать без поддержек
    sp += Cz(cx, cy, -60, -46, 5.4)                                    # ёлочка под трубку 6 мм
    for zb in (-58.0, -54.0, -50.0):
        sp += Pos(cx, cy, zb) * Cone(3.6, 2.7, 3.2, align=c)
    sp -= Cz(cx, cy, -158, -45, 3.6)                                   # канал
    for z in (-148.0, -155.0):                                         # выходы — от датчиков (назад и вбок)
        sp -= Cx(cy, z, cx, cx + 7, 2.5)
        sp -= Cx(cy, z, cx - 7, cx, 2.5)
        sp -= Cy(cx, z, cy, cy + 7, 2.5)
    return sp


# ============================================================================
#  Макеты модулей (только для проверки зазоров, не печатаются)
# ============================================================================
def make_dummies():
    m = {}
    # ярус 1
    m["Аккумулятор 103450"] = B(-44.2, 5.8, 37.7, 71.7, TZ1, TZ1 + BAT[2])
    m["TP4056"] = B(-20.75, -3.25, 0.5, 28.5, 6.3, 7.9) + B(-16.5, -7.5, 0.2, 7.5, 7.9, 11.1)
    for i, y in enumerate((11.7, 32.7)):
        m[f"MT3608 #{i + 1}"] = (B(11.7, 47.7, y - 1.0, y + 16.0, 6.3, 7.9)
                                 + B(14, 24, y + 1, y + 6, 7.9, 17.9) + B(30, 37, y + 4, y + 11, 7.9, 11.9))
    m["D4184"] = B(11.4, 46.4, 52.7, 69.7, 6.3, 7.9) + B(12, 20, 53, 69, 7.9, 17.9) + B(38, 46, 53, 69, 7.9, 17.9)
    m["Конденсатор 1000 мкФ"] = Cz(4, 6, TZ1, TZ1 + 16, 10)
    m["Тумблер KCD1"] = B(-45.5, -24.5, -5, -3, 7.3, 22.3) + B(-44.5, -25.5, -3, 15, 8.3, 21.3)
    # ярус 2
    m["Перфоплата 5x7"] = B(-52, -2, 2, 72, DZ1 + 4, DZ1 + 5.6)
    hz0, hz1 = DZ1 + 5.6, DZ1 + 14.1
    m["Гребёнки"] = (B(-40.95, -38.45, 8, 46.1, hz0, hz1) + B(-15.55, -13.05, 8, 46.1, hz0, hz1)
                     + B(-40.95, -38.45, 8, 46.1, hz1, hz1 + 2.5) + B(-15.55, -13.05, 8, 46.1, hz1, hz1 + 2.5))
    ez = hz1 + 2.5
    m["ESP32 DevKit"] = (B(-41.25, -12.75, 1.3, 1.3 + ESP_L, ez, ez + 1.6)
                         + B(-36, -18, 27.3, 1.3 + ESP_L, ez + 1.6, ez + 4.7)
                         + B(-31.5, -22.5, 0.5, 7.8, ez + 1.6, ez + 4.8))
    m["JST-XH"] = Compound([B(x, x + 8.5, 62, 68, DZ1 + 5.6, DZ1 + 12.6) for x in (-49.5, -40, -30.5, -21, -11.5)])
    m["pH-4502C"] = (B(4, 36, 0.9, 42.9, DZ1 + 3, DZ1 + 4.6) + B(14, 26, 1, 13, DZ1 + 5.1, DZ1 + 17.1)
                     + Cy(20, 38.3, -9, 1, 9.6) + B(8, 18, 28, 38, DZ1 + 4.6, DZ1 + 14.6))
    m["TDS v1.0"] = B(4, 46, 46.3, 78.3, DZ1 + 3, DZ1 + 4.6) + B(38, 46, 60, 66, DZ1 + 4.6, DZ1 + 10.6)
    m["BMP280"] = B(-OX - 5.6, -OX - 4.0, 80, 91.5, 18, 33)
    # колышек
    m["Датчик влажности v1.2"] = (B(-22, 1, SY - 0.8, SY + 0.8, -135, -37)
                                  + B(-18, -3, SY + 0.8, SY + 3.8, -60, -40) + B(-14, -6, SY - 3, SY + 3, -37, -31))
    m["DS18B20"] = Cz(-10, SY - 7.5, -115, -62, DS_PROBE_D)
    m["Щуп TDS"] = Cz(12, SY, -95, -50, TDS_PROBE_D) + Cz(9, SY, -107, -95, 1.5) + Cz(15, SY, -107, -95, 1.5)
    return m


# ============================================================================
#  Сборка, проверки, экспорт
# ============================================================================
PRINT_COLORS = {
    "Голова": "#1f6f43", "Лоток + панель": "#d9d9d9", "Палуба (2 ярус)": "#b5b5b5",
    "Колышек перед": "#7a5230", "Колышек зад": "#8d6239", "Игла полива": "#2b7bd1",
}
DUMMY_COLOR = {
    "ESP32 DevKit": "#1b1b1b", "Перфоплата 5x7": "#3a9b4f", "Гребёнки": "#222222", "JST-XH": "#f2f2f2",
    "TP4056": "#2554c7", "MT3608 #1": "#2554c7", "MT3608 #2": "#2554c7", "D4184": "#2554c7",
    "Аккумулятор 103450": "#e5b80b", "Конденсатор 1000 мкФ": "#333366", "Тумблер KCD1": "#111111",
    "pH-4502C": "#2554c7", "TDS v1.0": "#2554c7", "BMP280": "#7b2fbf",
    "Датчик влажности v1.2": "#c0392b", "DS18B20": "#9aa0a6", "Щуп TDS": "#111111",
}

# детали печатаются в таком положении (поворот от положения в сборке)
PRINT_ORIENT = {
    "Голова": Rot(-90, 0, 0),           # задней стенкой на стол, проём вверх
    "Лоток + панель": Rot(0, 0, 0),     # полом на стол
    "Палуба (2 ярус)": Rot(0, 0, 0),
    "Колышек перед": Rot(90, 0, 0),     # плоскостью разъёма на стол
    "Колышек зад": Rot(-90, 0, 0),
    "Игла полива": Rot(180, 0, 0),      # ёлочкой вниз, остриём вверх
}
BED = 180.0                             # Bambu A1 mini — самый маленький стол Bambu


# латиница для STEP/GLB: OpenCascade портит кириллицу в именах компонентов
LABEL = {
    "Голова": "1_Head", "Лоток + панель": "2_Tray_Panel", "Палуба (2 ярус)": "3_Deck",
    "Колышек перед": "4_Stake_Front", "Колышек зад": "5_Stake_Back", "Игла полива": "6_Water_Spike",
    "ESP32 DevKit": "ESP32_DevKit", "Перфоплата 5x7": "Perfboard_5x7", "Гребёнки": "Female_Headers",
    "JST-XH": "JST_XH", "TP4056": "TP4056", "MT3608 #1": "MT3608_1", "MT3608 #2": "MT3608_2",
    "D4184": "D4184", "Аккумулятор 103450": "Battery_103450", "Конденсатор 1000 мкФ": "Cap_1000uF",
    "Тумблер KCD1": "Switch_KCD1", "pH-4502C": "pH_4502C", "TDS v1.0": "TDS_v1", "BMP280": "BMP280",
    "Датчик влажности v1.2": "Moisture_v1_2", "DS18B20": "DS18B20", "Щуп TDS": "TDS_Probe",
}


def hexcolor(h):
    return Color(int(h[1:3], 16) / 255, int(h[3:5], 16) / 255, int(h[5:7], 16) / 255)


def build():
    front, back = make_stake()
    parts = {
        "Голова": make_shell(),
        "Лоток + панель": make_tray(),
        "Палуба (2 ярус)": make_deck(),
        "Колышек перед": front,
        "Колышек зад": back,
        "Игла полива": make_spike(),
    }
    return parts, make_dummies()


def check(parts, dummies, tol=0.05):
    items = list(parts.items()) + list(dummies.items())
    clashes = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            (na, a), (nb, b) = items[i], items[j]
            ba, bb = a.bounding_box(), b.bounding_box()
            if (ba.max.X < bb.min.X or bb.max.X < ba.min.X or ba.max.Y < bb.min.Y or bb.max.Y < ba.min.Y
                    or ba.max.Z < bb.min.Z or bb.max.Z < ba.min.Z):
                continue
            v = (a & b).volume
            if v > tol:
                clashes.append((na, nb, round(v, 2)))
    return clashes


def build_viewer(report):
    """out/viewer.html — 3D-просмотр в браузере, модель вшита внутрь."""
    import base64
    tpl = (Path(__file__).resolve().parent / "viewer_template.html").read_text()
    glb = base64.b64encode((OUT / "SoilPlus_assembly.glb").read_bytes()).decode()
    html = tpl.replace("__GLB_B64__", glb).replace("__REPORT__", json.dumps(report, ensure_ascii=False))
    (OUT / "viewer.html").write_text(html)


def main():
    OUT.mkdir(exist_ok=True)
    parts, dummies = build()

    clashes = check(parts, dummies)
    print("Пересечения (> 0.05 мм³):", "нет" if not clashes else "")
    for c in clashes:
        print("  ", c)

    report = {"clashes": clashes, "parts": {}}
    asm_children = []
    for name, shp in parts.items():
        shp.label, shp.color = LABEL[name], hexcolor(PRINT_COLORS[name])
        asm_children.append(shp)
        oriented = PRINT_ORIENT[name] * shp
        bb = oriented.bounding_box()
        size = [round(bb.size.X, 1), round(bb.size.Y, 1), round(bb.size.Z, 1)]
        fits = size[0] <= BED and size[1] <= BED and size[2] <= BED
        report["parts"][name] = {"size_print_mm": size, "fits_180": fits, "volume_cm3": round(shp.volume / 1000, 1)}
        fn = OUT / f"{LABEL[name]}.stl"
        export_stl(Pos(-bb.min.X, -bb.min.Y, -bb.min.Z) * oriented, str(fn))
    for name, shp in dummies.items():
        shp.label, shp.color = "dummy_" + LABEL[name], hexcolor(DUMMY_COLOR[name])
        asm_children.append(shp)

    asm = Compound(children=asm_children, label="SoilPlus")
    export_step(asm, str(OUT / "SoilPlus_assembly.step"))
    export_gltf(asm, str(OUT / "SoilPlus_assembly.glb"), binary=True,
                linear_deflection=0.1, angular_deflection=0.3)
    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
    build_viewer(report)
    for n, r in report["parts"].items():
        print(f"{n:18s} {r['size_print_mm']}  {'OK' if r['fits_180'] else 'НЕ ВЛЕЗАЕТ'}  {r['volume_cm3']} см³")
    return 1 if clashes else 0


if __name__ == "__main__":
    sys.exit(main())
