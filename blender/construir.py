import sys, importlib, bpy, traceback, os
R = os.path.dirname(os.path.abspath(__file__))
if R not in sys.path:
    sys.path.append(R)
import hogar_lib
importlib.reload(hogar_lib)
MODULOS = ['m_muebles', 'm_resto', 'm_materiales', 'm_suciedad', 'm_nuevos', 'm_exterior', 'm_casa3']


def construir_todo(solo=None):
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob)
    for me in list(bpy.data.meshes):
        if me.users == 0:
            bpy.data.meshes.remove(me)
    for m in MODULOS:
        mod = importlib.import_module(m)
        importlib.reload(mod)
    errores = {}
    tris = {}
    for k, i in enumerate(hogar_lib.MODELOS):
        if solo and i not in solo:
            continue
        try:
            raiz = hogar_lib.construir(i, ((k % 8) * 2.4, -(k // 8) * 2.6))
            tris[i] = sum(sum(len(p.vertices) - 2 for p in ch.data.polygons) for ch in raiz.children)
        except Exception:
            errores[i] = traceback.format_exc()[-800:]
    return errores, tris


def exportar():
    d = os.path.join(os.path.dirname(R), 'assets')
    os.makedirs(d, exist_ok=True)
    return hogar_lib.exportar(os.path.join(d, 'modelos.glb'))
