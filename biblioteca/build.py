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
# altas en curso (no están todavía en A.05 / Apéndice A)
recs.append(dict(fam='Calidad',cod='Q.25',nom='Registro de oportunidades de mejora',fe='',rv='0',resp='Diego Ortiz',sop='Electrónico',est='n'))
recs.append(dict(fam='Instructivos',cod='I.18',nom='Registro y control de moldes (P.07)',fe='11/10/2026',rv='01',resp='Diego Ortiz',sop='Electrónico',est='n'))
recs.append(dict(fam='Instructivos',cod='I.19',nom='Oportunidades de mejora (Q.25)',fe='08/11/2026',rv='00',resp='Diego Ortiz',sop='Papel',est='n'))
recs.append(dict(fam='Instructivos',cod='I.20',nom='Informe de NC y OM (Q.21)',fe='08/11/2026',rv='00',resp='Diego Ortiz',sop='Papel',est='n'))
GH='https://diegortizdao-collab.github.io/'
APP={'A.09':GH+'SGC-Silver-Industrial/a09/','Ap. C':GH+'SGC-Silver-Industrial/apendice-c/','A.14':GH+'SGC-Silver-Industrial/rrhh/','A.18':GH+'SGC-Silver-Industrial/rrhh/','A.26':GH+'SGC-Silver-Industrial/rrhh/',
'Q.11':GH+'Q.11-Estadisticas-No-Conforme/','Q.21':GH+'NC-Silver-Industrial/','Q.25':GH+'NC-Silver-Industrial/','P.07':GH+'P07-Moldes-Silver-Industrial/','P.10':GH+'P07-Moldes-Silver-Industrial/','I.18':GH+'P07-Moldes-Silver-Industrial/','I.19':GH+'NC-Silver-Industrial/','I.20':GH+'NC-Silver-Industrial/','Q.12':GH+'Ficha-Silver-Industrial/','A.12':GH+'Certificados-MP-Silver-Industrial/','A.20':GH+'A20-Auditorias-Silver-Industrial/','A.31':GH+'FODA-Silver/','A.19':GH+'Revision-de-la-Direccion/','A.24':GH+'Revision-de-la-Direccion/'}
SHEET={'A.05':'1kJ_Z2C6E1SggbOxqjK7LywxEgbqbVZlzN_IdBaxYd5M','A.15':'1v7QKOgdqBkNFwJmAC47_kVEEmapWLWIdNKOW9OTIiRw'}
FILE={'I.18':'10jNYWVQwC0bINGHlmscvPe0pbAfaRHbI','I.19':'1-h_QvfAJ-rakpSf-Obx85QamjU9FPhFl','I.20':'1YtlNEFp60d681IrUg3coTgzGI5K7STkQ','Ap. A':'1pfeY_ckHDZ45JR7ufvJvU-AUz_llAI22','Ap. C':'1TVuJEclVobUoBS2RoH8EjJAIPccwkLY6','I.09':'1GN45VoT-OF1tRS606QBIyMI3n2vg5Nch','A.08':'10K_tzHM7NIIxUctGMZOdcc15PU5hboUm'}
NOTE={'I.19':'Alta nueva (Rev. 00, 8/11/2026): ya subido a Drive, aún no figura en el Apéndice A ni en el A.15. Pendiente de aprobación.',
'I.20':'Alta nueva (Rev. 00, 8/11/2026): ya subido a Drive, aún no figura en el Apéndice A ni en el A.15. Pendiente de aprobación.',
'P.07':'Rev. 3 del 11/10/2026 (la app ya la imprime). En el A.05 todavía figura Rev. 2 · 9/11/2010: pendiente actualizar.',
'Q.12':'Rev. 3 del 11/10/2026 (formato generado desde la app). En el A.05 figura Rev. 2 · 18/6/2019: pendiente actualizar.',
'A.08':'Vigente: archivo actualizado el 23/10/2026, sigue en Rev. 2 porque el formato no cambió. En el A.05 todavía dice 11/7/2011.',
'P.10':'Rev. 2 confirmada. La hoja de altas y bajas vive como solapa dentro de la app del P.07.',
'PR.05':'Rev. 6 en borrador: todavía no figura como vigente en el Apéndice A.',
'Q.11':'Versión digital (Rev. 3) en curso; el A.05 muestra Rev. 2.',
'Q.25':'Alta nueva (Rev. 0): aún no figura en el A.05.',
'I.18':'Alta nueva (Rev. 01, 11/10/2026): ya subido a Drive, aún no figura en el Apéndice A ni en el A.15. I.13 sigue disponible.',
'Ap. A':'Vista previa de la versión del 29/10/25. Corregir fila I.01/I.05 duplicada y fechas antes de reemplazarla.'}
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
