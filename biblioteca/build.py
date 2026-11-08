import json,urllib.parse
R={'R':'Ramón Ortigoza','D':'Diego Ortiz'}; S={'P':'Papel','E':'Electrónico'}
recs=[]
for l in open('data.txt',encoding='utf-8'):
    if l.startswith('#') or not l.strip(): continue
    f=l.rstrip('\n').split('|')
    fam,cod,nom,fe,rv,resp,sop,est=f[:8]
    recs.append(dict(fam=fam,cod=cod,nom=nom,fe=fe,rv=rv,resp=resp,sop=sop,est=est.strip()))
for l in open('clientes.txt',encoding='utf-8'):
    if not l.strip(): continue
    f=l.rstrip('\n').split('|')
    cod,nom,fe,rv,resp,sop,est=f
    recs.append(dict(fam='Clientes',cod=cod,nom=nom,fe=fe,rv=rv,resp=R.get(resp,resp),sop=S.get(sop,sop),est=est.strip()))
# altas recientes
recs.append(dict(fam='Calidad',cod='Q.25',nom='Registro de oportunidades de mejora',fe='08/11/2026',rv='0',resp='Diego Ortiz',sop='Electrónico',est='v'))
recs.append(dict(fam='Instructivos',cod='I.18',nom='Registro y control de moldes (P.07)',fe='11/10/2026',rv='01',resp='Diego Ortiz',sop='Electrónico',est='v'))
recs.append(dict(fam='Instructivos',cod='I.19',nom='Oportunidades de mejora (Q.25)',fe='08/11/2026',rv='00',resp='Diego Ortiz',sop='Papel',est='v'))
recs.append(dict(fam='Instructivos',cod='I.20',nom='Informe de NC y OM (Q.21)',fe='08/11/2026',rv='00',resp='Diego Ortiz',sop='Papel',est='v'))
GH='https://diegortizdao-collab.github.io/'
APP={'A.09':GH+'SGC-Silver-Industrial/a09/','Ap. C':GH+'SGC-Silver-Industrial/apendice-c/','A.14':GH+'SGC-Silver-Industrial/rrhh/','A.18':GH+'SGC-Silver-Industrial/rrhh/','A.26':GH+'SGC-Silver-Industrial/rrhh/',
'Q.11':GH+'Q.11-Estadisticas-No-Conforme/','Q.21':GH+'NC-Silver-Industrial/','Q.25':GH+'NC-Silver-Industrial/','P.07':GH+'P07-Moldes-Silver-Industrial/','P.10':GH+'P07-Moldes-Silver-Industrial/','I.18':GH+'P07-Moldes-Silver-Industrial/','I.19':GH+'NC-Silver-Industrial/','I.20':GH+'NC-Silver-Industrial/','Q.12':GH+'Ficha-Silver-Industrial/','A.12':GH+'Certificados-MP-Silver-Industrial/','A.20':GH+'A20-Auditorias-Silver-Industrial/','A.31':GH+'FODA-Silver/','A.19':GH+'Revision-de-la-Direccion/','A.24':GH+'Revision-de-la-Direccion/'}
SHEET={}
FILE={'I.18':'10jNYWVQwC0bINGHlmscvPe0pbAfaRHbI','I.19':'1-h_QvfAJ-rakpSf-Obx85QamjU9FPhFl','I.20':'1YtlNEFp60d681IrUg3coTgzGI5K7STkQ','Ap. A':'1J60ijkghdy96A3N2hBCMd7sdFDk9NDTK','A.05':'1yze79mKcJOBLjMbDq4SojZDEUWZy17Jp','A.15':'1dZgMLrlF8uY7EiUMr-re5B2YeYWwEbft','A.27':'1OltBJEk48HeMDuwC-MGDVHcIj7F6u-DY','A.38':'1fi0Gyg_W9QFKxw4NW6zqO3bYWcRvLjK8','PR.05':'13s-bYpbRmkmGH2Ran0by6DEX9P4LOPfU','Ap. C':'1TVuJEclVobUoBS2RoH8EjJAIPccwkLY6','I.09':'1GN45VoT-OF1tRS606QBIyMI3n2vg5Nch','A.08':'10K_tzHM7NIIxUctGMZOdcc15PU5hboUm'}
NOTE={
'P.07':'Rev. 3 del 11/10/2026 (la app ya la imprime). En el A.05 todavía figura Rev. 2 · 9/11/2010: pendiente actualizar.',
'Q.12':'Rev. 3 del 11/10/2026 (formato generado desde la app). En el A.05 figura Rev. 2 · 18/6/2019: pendiente actualizar.',
'A.08':'Vigente: archivo actualizado el 23/10/2026, sigue en Rev. 2 porque el formato no cambió. En el A.05 todavía dice 11/7/2011.',
'P.10':'Rev. 2 confirmada. La hoja de altas y bajas vive como solapa dentro de la app del P.07.',
'Q.11':'Versión digital (Rev. 3) en curso; el A.05 muestra Rev. 2. Pendiente actualizar el encabezado (PR.05 Rev. 6).',
'Q.21':'Pendiente: agregar la clasificación de la NC en el Bloque 2 (PR.05 Rev. 6).',
'A.38':'Alta 8/11/2026 (PR.05 Rev. 6). Formulario vacío: falta cargar el primer backup del Q.11.'}
FOLD={'Manual':'1DLU90kc1rLPGCYldvZJ_8-wlfdAaFNOe','Apéndices':'1DLU90kc1rLPGCYldvZJ_8-wlfdAaFNOe','Procedimientos':'1zvTm-kOSOBrC-Crkl2E4YhUTYoJE_XO3','Instructivos':'1zvTm-kOSOBrC-Crkl2E4YhUTYoJE_XO3','Administrativos':'15Glz2r0_S1NAjJlUa5_0stapsqcfXlhi','Calidad':'15Glz2r0_S1NAjJlUa5_0stapsqcfXlhi','Mantenimiento':'15Glz2r0_S1NAjJlUa5_0stapsqcfXlhi','Clientes':'15Glz2r0_S1NAjJlUa5_0stapsqcfXlhi','Sistemas':'15Glz2r0_S1NAjJlUa5_0stapsqcfXlhi','Producción':'1px5ya-GdvjWbo4gteUpZ_UIVddYG6uNr'}
for r in recs:
    c=r['cod']
    r['app']=APP.get(c,'')
    r['q']='https://drive.google.com/drive/search?q='+urllib.parse.quote(c if c!='s/c' else r['nom'])
    r['fold']='https://drive.google.com/drive/folders/'+FOLD[r['fam']]
    if c in SHEET: r['prev']='https://docs.google.com/spreadsheets/d/%s/preview'%SHEET[c]; r['open']='https://docs.google.com/spreadsheets/d/%s/edit'%SHEET[c]
    elif c in FILE: r['prev']='https://drive.google.com/file/d/%s/preview'%FILE[c]; r['open']='https://drive.google.com/file/d/%s/view'%FILE[c]
    if c in NOTE: r['nota']=NOTE[c]
    if c=='A.08': r['fe']='23/10/2026'
    if c in('P.07','Q.12'): r['rv']='3'
fams=['Manual','Procedimientos','Instructivos','Administrativos','Producción','Calidad','Mantenimiento','Clientes','Sistemas','Apéndices']
LBL={'Manual':'Manual','Procedimientos':'Procedimientos (PR)','Instructivos':'Instructivos (I)','Administrativos':'Registros A','Producción':'Registros P','Calidad':'Registros Q','Mantenimiento':'Registros M','Clientes':'Registros C','Sistemas':'Sistemas','Apéndices':'Apéndices'}
tpl=open('tpl.html',encoding='utf-8').read()
out=tpl.replace('/*DATA*/',"var REC=%s,FAMS=%s,LBL=%s;"%(json.dumps(recs,ensure_ascii=False),json.dumps(fams,ensure_ascii=False),json.dumps(LBL,ensure_ascii=False)))
open('index.html','w',encoding='utf-8').write(out)
import collections
print(len(recs),collections.Counter(r['est'] for r in recs))
