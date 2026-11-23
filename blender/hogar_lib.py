import bpy, bmesh, math, json, os
from mathutils import Matrix, Vector, Euler

RAIZ = os.path.dirname(os.path.abspath(__file__))
CAT = json.load(open(os.path.join(RAIZ, 'catalogo.json')))
EJE = Matrix.Rotation(math.radians(90), 4, 'X')
GIRO_Y = Matrix.Rotation(math.radians(-90), 4, 'X')
PI = math.pi


def lineal(h):
    def c(v):
        v = v / 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return (c((h >> 16) & 255), c((h >> 8) & 255), c(h & 255), 1)


def coleccion():
    col = bpy.data.collections.get('Hogar')
    if not col:
        col = bpy.data.collections.new('Hogar')
        bpy.context.scene.collection.children.link(col)
    return col


def material(nombre, color, rug=0.75, metal=0.0, alfa=1.0, brillo=False):
    m = bpy.data.materials.get(nombre)
    if not m:
        m = bpy.data.materials.new(nombre)
        try:
            m.use_nodes = True
        except Exception:
            pass
    nt = m.node_tree
    b = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if b is None:
        b = nt.nodes.new('ShaderNodeBsdfPrincipled')
        out = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None) or nt.nodes.new('ShaderNodeOutputMaterial')
        nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    b.inputs['Base Color'].default_value = lineal(color)
    b.inputs['Roughness'].default_value = rug
    b.inputs['Metallic'].default_value = metal
    b.inputs['Alpha'].default_value = alfa
    if brillo:
        b.inputs['Emission Color'].default_value = lineal(color)
        b.inputs['Emission Strength'].default_value = 0.4
    if alfa < 1:
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            pass
    m.diffuse_color = lineal(color)
    return m


def c(hexa, rug=0.75, metal=0.0, alfa=1.0, de=None, brillo=False):
    return ('c', hexa, rug, metal, alfa, de, brillo)


class Item:
    actual = None

    def __init__(self, ident):
        self.id = ident
        self.partes = {}
        Item.actual = self

    def poner(self, dueno, ob):
        self.partes.setdefault(dueno, []).append(ob)


def _bm_a_obj(bm, suave=True):
    me = bpy.data.meshes.new('tmp')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = suave
    ob = bpy.data.objects.new('tmp', me)
    coleccion().objects.link(ob)
    return ob


def _aplicar(ob):
    if not ob.modifiers:
        return
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    viejo = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(viejo)


def _biselar(ob, ancho, seg=2, angulo=40, duro=True):
    if ancho <= 0:
        return
    m = ob.modifiers.new('bisel', 'BEVEL')
    m.width = ancho
    m.segments = seg
    m.limit_method = 'ANGLE'
    m.angle_limit = math.radians(angulo)
    m.use_clamp_overlap = True
    m.harden_normals = duro


def _subdividir(ob, nivel):
    if nivel:
        m = ob.modifiers.new('sub', 'SUBSURF')
        m.levels = nivel
        m.render_levels = nivel


def _colocar(dueno, ob, pos, rot, orden='ZYX'):
    ob.matrix_world = EJE @ Matrix.Translation(Vector(pos)) @ Euler(rot, orden).to_matrix().to_4x4()
    Item.actual.poner(dueno, ob)
    return ob


def B(o, w, h, d, x, y, z, r=0.02, s=2, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co = Vector((v.co.x * w, v.co.y * h, v.co.z * d))
    ob = _bm_a_obj(bm)
    _biselar(ob, min(r, w / 2.05, h / 2.05, d / 2.05), s)
    _aplicar(ob)
    return _colocar(o, ob, (x, y, z), rot)


def K(o, w, h, d, x, y, z, r=None, inflar=0.25, rot=(0, 0, 0), nivel=1):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co = Vector((v.co.x * w, v.co.y * h, v.co.z * d))
    ob = _bm_a_obj(bm)
    r = r if r is not None else min(w, h, d) * 0.42
    _biselar(ob, min(r, w / 2.05, h / 2.05, d / 2.05), 2, duro=False)
    _subdividir(ob, nivel)
    _aplicar(ob)
    if inflar:
        hw, hh, hd = w / 2, h / 2, d / 2
        for v in ob.data.vertices:
            fx = max(0.0, 1 - (v.co.x / hw) ** 2)
            fz = max(0.0, 1 - (v.co.z / hd) ** 2)
            v.co.y += math.copysign(1, v.co.y) * inflar * hh * fx * fz * min(1, abs(v.co.y) / hh)
    return _colocar(o, ob, (x, y, z), rot)


def Y(o, diam, h, x, y, z, arriba=None, n=24, r=0.008, rot=(0, 0, 0), suave=True):
    bm = bmesh.new()
    r1 = diam / 2
    r2 = (arriba if arriba is not None else diam) / 2
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=n, radius1=r1, radius2=r2, depth=h)
    bmesh.ops.transform(bm, matrix=GIRO_Y, verts=bm.verts)
    ob = _bm_a_obj(bm, suave)
    _biselar(ob, min(r, h / 2.05, min(r1, r2) * 0.9 if min(r1, r2) > 0 else r), 2, angulo=50)
    _aplicar(ob)
    return _colocar(o, ob, (x, y, z), rot)


def S(o, w, h, d, x, y, z, rot=(0, 0, 0), n=16, orden='ZYX'):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=n, v_segments=max(6, n * 2 // 3), radius=0.5)
    bmesh.ops.transform(bm, matrix=GIRO_Y, verts=bm.verts)
    for v in bm.verts:
        v.co = Vector((v.co.x * w, v.co.y * h, v.co.z * d))
    ob = _bm_a_obj(bm)
    return _colocar(o, ob, (x, y, z), rot, orden)


def L(o, perfil, x, y, z, n=24, rot=(0, 0, 0), suave=True, tapar=True, a0=0.0, arco=2 * PI, grosor=0.0):
    bm = bmesh.new()
    cerrado = arco >= 2 * PI - 1e-6
    pasos = n if cerrado else n + 1
    anillos = []
    for (r, yy) in perfil:
        if r <= 1e-5:
            anillos.append([bm.verts.new((0, yy, 0))] * pasos)
        else:
            anillos.append([bm.verts.new((math.cos(a0 + arco * k / n) * r, yy, math.sin(a0 + arco * k / n) * r)) for k in range(pasos)])
    for a, b in zip(anillos, anillos[1:]):
        for k in range(n):
            k2 = (k + 1) % pasos
            vs = []
            for v in (a[k], a[k2], b[k2], b[k]):
                if v not in vs:
                    vs.append(v)
            if len(vs) >= 3:
                try:
                    bm.faces.new(vs)
                except ValueError:
                    pass
    if tapar and cerrado:
        if len(set(anillos[0])) > 1:
            bm.faces.new(list(reversed(anillos[0])))
        if len(set(anillos[-1])) > 1:
            bm.faces.new(anillos[-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = _bm_a_obj(bm, suave)
    if grosor:
        m = ob.modifiers.new('grosor', 'SOLIDIFY')
        m.thickness = grosor
        m.offset = -1
        _aplicar(ob)
    return _colocar(o, ob, (x, y, z), rot)


def T(o, R, r, x, y, z, rot=(0, 0, 0), n=24, m=10, arco=2 * PI, a0=0.0):
    bm = bmesh.new()
    cerrado = arco >= 2 * PI - 1e-6
    pasos = n if cerrado else n + 1
    anillos = []
    for i in range(pasos):
        a = a0 + arco * i / n
        centro = Vector((math.cos(a) * R, 0, math.sin(a) * R))
        radial = Vector((math.cos(a), 0, math.sin(a)))
        anillos.append([bm.verts.new(centro + radial * math.cos(2 * PI * j / m) * r + Vector((0, 1, 0)) * math.sin(2 * PI * j / m) * r) for j in range(m)])
    total = n if cerrado else n
    for i in range(total):
        a, b = anillos[i], anillos[(i + 1) % pasos]
        for j in range(m):
            bm.faces.new((a[j], b[j], b[(j + 1) % m], a[(j + 1) % m]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = _bm_a_obj(bm)
    return _colocar(o, ob, (x, y, z), rot)


def U(o, puntos, r, n=8, rot=(0, 0, 0), pos=(0, 0, 0)):
    cu = bpy.data.curves.new('tubo', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = max(1, n // 4 - 1)
    cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(puntos) - 1)
    for bp, p in zip(sp.bezier_points, puntos):
        bp.co = Vector(p)
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'
    cu.resolution_u = 6
    tmp = bpy.data.objects.new('tubo', cu)
    coleccion().objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg), depsgraph=dg)
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new('tmp', me)
    coleccion().objects.link(ob)
    return _colocar(o, ob, pos, rot)


def mat_pieza(ident, i):
    col, alfa, metal, rug, brillo = CAT[ident][i]
    return material(f'{ident}__m{i}', col, rug, metal, alfa, bool(brillo))


def terminar(ident, desplazar=(0, 0)):
    it = Item.actual
    raiz = bpy.data.objects.new(f'item_{ident}', None)
    coleccion().objects.link(raiz)
    raiz['hogar'] = 1
    k = 0
    for dueno, obs in it.partes.items():
        activo = obs[0]
        if len(obs) > 1:
            with bpy.context.temp_override(active_object=activo, object=activo, selected_objects=obs, selected_editable_objects=obs):
                bpy.ops.object.join()
        if isinstance(dueno, int):
            activo.name = f'{ident}__p{dueno}'
            activo.data.materials.clear()
            activo.data.materials.append(mat_pieza(ident, dueno))
        else:
            _, hexa, rug, metal, alfa, de, brillo = dueno
            nombre = f'{ident}__c{hexa:06x}_{k}' + (f'_o{de}' if de is not None else '')
            k += 1
            activo.name = nombre
            activo.data.materials.clear()
            activo.data.materials.append(material(f'c{hexa:06x}_{rug}_{metal}_{alfa}_{int(brillo)}', hexa, rug, metal, alfa, brillo))
        activo.data.name = activo.name
        mw = activo.matrix_world.copy()
        activo.parent = raiz
        activo.matrix_parent_inverse = Matrix.Identity(4)
        activo.matrix_world = mw
    raiz.location = (desplazar[0], desplazar[1], 0)
    return raiz


def borrar(ident):
    raiz = bpy.data.objects.get(f'item_{ident}')
    if raiz:
        for ch in list(raiz.children):
            me = ch.data
            bpy.data.objects.remove(ch)
            if me and me.users == 0:
                bpy.data.meshes.remove(me)
        bpy.data.objects.remove(raiz)


MODELOS = {}


def modelo(ident):
    def deco(f):
        MODELOS[ident] = f
        return f
    return deco


def construir(ident, desplazar=(0, 0)):
    borrar(ident)
    Item(ident)
    MODELOS[ident]()
    return terminar(ident, desplazar)


def exportar(ruta):
    import io, contextlib, logging
    logging.disable(logging.INFO)
    bpy.ops.object.select_all(action='DESELECT')
    guardado = {}
    for ob in bpy.data.objects:
        if ob.get('hogar'):
            guardado[ob.name] = tuple(ob.location)
            ob.location = (0, 0, 0)
            ob.select_set(True)
            for ch in ob.children:
                ch.select_set(True)
    with contextlib.redirect_stdout(io.StringIO()):
      bpy.ops.export_scene.gltf(filepath=ruta, export_format='GLB', use_selection=True, export_yup=True,
                              export_apply=False, export_materials='EXPORT', export_normals=True,
                              export_cameras=False, export_lights=False,
                              export_extras=False, export_animations=False,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10)
    for n, loc in guardado.items():
        bpy.data.objects[n].location = loc
    return os.path.getsize(ruta)


def P(o, pts, prof, x, y, z, eje='z', r=0.01, s=2, rot=(0, 0, 0), suave=True):
    bm = bmesh.new()
    def m(u, v, t):
        if eje == 'z':
            return (u, v, t)
        if eje == 'x':
            return (t, v, u)
        return (u, t, v)
    base = [bm.verts.new(m(u, v, -prof / 2)) for (u, v) in pts]
    cara = bm.faces.new(base)
    ext = bmesh.ops.extrude_face_region(bm, geom=[cara])
    nuevos = [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]
    d = {'z': (0, 0, prof), 'x': (prof, 0, 0), 'y': (0, prof, 0)}[eje]
    bmesh.ops.translate(bm, vec=Vector(d), verts=nuevos)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = _bm_a_obj(bm, suave)
    _biselar(ob, min(r, prof / 2.05), s, angulo=35)
    _aplicar(ob)
    return _colocar(o, ob, (x, y, z), rot)


def arco(cx, cy, rx, ry, a0, a1, n):
    return [(cx + math.cos(a0 + (a1 - a0) * i / n) * rx, cy + math.sin(a0 + (a1 - a0) * i / n) * ry) for i in range(n + 1)]
