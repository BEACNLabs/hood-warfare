# Headless Blender 5.1: Poly Haven gltf + the CC0 AK fbx -> compact GLBs for Hood Warfare.
# Usage: blender -b --python tools/optimize.py -- [slug ...]   (no slugs = everything)
import bpy, os, sys, traceback, mathutils
ROOT = r"C:\Users\User\Desktop\Claude code projects\hood-warfare"
PH = os.path.join(ROOT, "assets", "ph", "models")
OUT = os.path.join(ROOT, "assets", "models")
PREV = os.path.join(ROOT, "assets", "previews")
ONLY = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
# slug: (triangle budget, join into one mesh)
TABLE = {
 "fire_hydrant": (6000, True), "metal_trash_can": (5000, True), "old_tyre": (5000, True),
 "plastic_monobloc_chair_01": (5000, True), "trashbag": (4000, True), "cardboard_box_01": (2000, True),
 "propane_tank": (4000, True), "power_box_01": (4000, True), "utility_box_01": (4000, True),
 "exterior_aircon_unit": (6000, True), "security_light": (3000, True), "rusted_wheel_rim_01": (4000, True),
 "ammo_box": (3000, True), "wooden_crate_01": (3000, True), "plastic_crate_01": (3000, True),
 "metal_jerrycan": (3000, True), "water_manhole_cover": (2000, True), "street_lamp_01": (5000, True),
 "street_lamp_02": (8000, True), "covered_car": (8000, True), "concrete_road_barrier": (4000, True),
 "old_bed_frame": (10000, True), "modular_street_seating": (12000, False), "bolt_action_rifle_7_62": (12000, True),
 "modular_chainlink_fence": (30000, False), "modular_electricity_poles": (45000, False), "modular_electric_cables": (20000, False),
 "grass_medium_01": (9000, False), "grass_medium_02": (6000, False), "shrub_01": (6000, True), "shrub_03": (4000, True),
 "wild_rooibos_bush": (4000, True), "weed_plant_02": (2500, True), "nettle_plant": (2500, True), "dandelion_01": (2000, True),
 "dead_tree_trunk": (14000, True), "tree_small_02": (34000, True), "island_tree_01": (34000, True), "jacaranda_tree": (40000, True),
}

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def meshes():
    return [o for o in bpy.data.objects if o.type == 'MESH']

def tri_count(objs):
    return sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs if o.type == 'MESH')

def decimate(objs, budget):
    total = tri_count(objs)
    if total <= budget:
        return total
    ratio = budget / total
    for o in objs:
        bpy.context.view_layer.objects.active = o
        m = o.modifiers.new("dec", 'DECIMATE')
        m.ratio = ratio
        m.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=m.name)
    return tri_count(objs)

def join_all(objs):
    if len(objs) < 2:
        return objs
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    return [objs[0]]

def bounds(objs):
    xs, ys, zs = [], [], []
    for o in objs:
        for c in o.bound_box:
            v = o.matrix_world @ mathutils.Vector(c)
            xs.append(v.x); ys.append(v.y); zs.append(v.z)
    return (min(xs), min(ys), min(zs)), (max(xs), max(ys), max(zs))

def render(name):
    try:
        objs = meshes()
        (x0, y0, z0), (x1, y1, z1) = bounds(objs)
        cx, cy, cz = (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2
        r = max(x1 - x0, y1 - y0, z1 - z0) or 1
        cam = bpy.data.cameras.new("c")
        co = bpy.data.objects.new("cam", cam)
        bpy.context.scene.collection.objects.link(co)
        co.location = mathutils.Vector((cx + r * 1.1, cy - r * 1.5, cz + r * 0.8))
        d = mathutils.Vector((cx, cy, cz)) - co.location
        co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        cam.lens = 35
        bpy.context.scene.camera = co
        sun = bpy.data.lights.new("s", 'SUN')
        sun.energy = 3
        so = bpy.data.objects.new("sun", sun)
        bpy.context.scene.collection.objects.link(so)
        so.rotation_euler = (0.9, 0.2, 0.6)
        w = bpy.context.scene.world or bpy.data.worlds.new("W")
        bpy.context.scene.world = w
        w.use_nodes = True
        bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
        bg.inputs[0].default_value = (0.5, 0.6, 0.7, 1)
        bg.inputs[1].default_value = 0.6
        sc = bpy.context.scene
        sc.render.resolution_x = 640
        sc.render.resolution_y = 480
        sc.render.resolution_percentage = 100
        for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE', 'BLENDER_WORKBENCH'):
            try:
                sc.render.engine = eng
                break
            except TypeError:
                pass
        try:
            sc.eevee.taa_render_samples = 16
        except Exception:
            pass
        sc.render.filepath = os.path.join(PREV, name + ".png")
        bpy.ops.render.render(write_still=True)
    except Exception:
        traceback.print_exc()

def export(name, anims=False, apply=True):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + ".glb"), export_format='GLB',
        export_image_format='WEBP', export_image_quality=80, export_apply=apply, export_yup=True,
        export_animations=anims, export_skins=anims, export_morph=False, export_lights=False, export_cameras=False)

BIG = {"modular_chainlink_fence", "modular_electricity_poles", "modular_electric_cables", "covered_car", "street_lamp_01", "street_lamp_02", "tree_small_02", "island_tree_01", "jacaranda_tree", "dead_tree_trunk", "shrub_01", "old_bed_frame", "concrete_road_barrier", "bolt_action_rifle_7_62"}
def shrink_images(size):
    for img in bpy.data.images:
        try:
            if img.size[0] > size: img.scale(size, size)
        except Exception: pass
def do_ph(slug, budget, join):
    reset()
    bpy.ops.import_scene.gltf(filepath=os.path.join(PH, slug, slug + ".gltf"))
    shrink_images(1024 if slug in BIG else 512)
    for o in list(bpy.data.objects):
        if o.type != 'MESH':
            bpy.data.objects.remove(o)
    objs = meshes()
    before = tri_count(objs)
    after = decimate(objs, budget)
    if join:
        objs = join_all(objs)
        objs[0].name = slug
    export(slug)
    render(slug)
    size = os.path.getsize(os.path.join(OUT, slug + ".glb"))
    print(f"[ok] {slug}: tris {before}->{after}, nodes {len(objs)}, {size/1e6:.2f} MB", flush=True)

def do_ak():
    reset()
    fbx = r"C:\Users\User\Desktop\Claude code projects\_dl\weapons\pack\WeaponsPack\AK47\SKM_AK47.fbx"
    try:
        bpy.ops.import_scene.fbx(filepath=fbx)
    except Exception:
        bpy.ops.wm.fbx_import(filepath=fbx)
    objs = meshes()
    print("AK objects:", [(o.name, o.type) for o in bpy.data.objects], "tris", tri_count(objs),
          "actions", [a.name for a in bpy.data.actions], flush=True)
    d = os.path.dirname(fbx)
    for o in objs:
        if not o.data.materials:
            o.data.materials.append(bpy.data.materials.new("AK"))
        for m in o.data.materials:
            if not m:
                continue
            m.use_nodes = True
            nt = m.node_tree
            bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
            def tex(fn, cs):
                img = bpy.data.images.load(os.path.join(d, fn))
                img.colorspace_settings.name = cs
                n = nt.nodes.new('ShaderNodeTexImage')
                n.image = img
                return n
            c = tex("T_AK47_C.png", 'sRGB')
            nt.links.new(c.outputs[0], bsdf.inputs['Base Color'])
            nrm = tex("T_AK47_N.png", 'Non-Color')
            nm = nt.nodes.new('ShaderNodeNormalMap')
            nt.links.new(nrm.outputs[0], nm.inputs['Color'])
            nt.links.new(nm.outputs[0], bsdf.inputs['Normal'])
            rm = tex("T_AK47_RMAO.png", 'Non-Color')
            sep = nt.nodes.new('ShaderNodeSeparateColor')
            nt.links.new(rm.outputs[0], sep.inputs[0])
            nt.links.new(sep.outputs[0], bsdf.inputs['Roughness'])
            nt.links.new(sep.outputs[1], bsdf.inputs['Metallic'])
    print("AK bounds", bounds(objs), flush=True)
    export("ak47", anims=True, apply=False)
    render("ak47")
    print(f"[ok] ak47 {os.path.getsize(os.path.join(OUT, 'ak47.glb'))/1e6:.2f} MB", flush=True)

jobs = ONLY or (["ak47"] + list(TABLE.keys()))
for j in jobs:
    try:
        if j == "ak47":
            do_ak()
        else:
            do_ph(j, *TABLE[j])
    except Exception:
        print("[fail]", j, flush=True)
        traceback.print_exc()
