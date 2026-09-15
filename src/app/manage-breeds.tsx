import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context-auth';
const API='http://119.59.102.161:3099/api/breeds';
const C={bg:'#FFF8FA',white:'#fff',ink:'#2D2025',muted:'#7E6870',pink:'#E75480',pinkDark:'#C83D68',border:'#EBCFD8',soft:'#FFF0F4',danger:'#B93859'};
type Breed={breed_id:number;breed_name:string;description?:string|null;image_url?:string|null};
const empty={breed_name:'',description:'',image_url:''};
const notify=(t:string,m:string)=>Platform.OS==='web'?window.alert(`${t}\n\n${m}`):Alert.alert(t,m);

export default function ManageBreeds(){
 const {user,token}=useAuth();
 const [items,setItems]=useState<Breed[]>([]);
 const [editing,setEditing]=useState<Breed|null>(null);
 const [form,setForm]=useState(empty);
 const [loading,setLoading]=useState(false); const [search,setSearch]=useState('');

 const load=async()=>{setLoading(true);try{const r=await fetch(API);if(!r.ok)throw new Error('โหลดสายพันธุ์ไม่สำเร็จ');setItems(await r.json())}catch(e){notify('ผิดพลาด',e instanceof Error?e.message:'เชื่อมต่อไม่ได้')}finally{setLoading(false)}};
 useEffect(()=>{if(user?.role==='admin')load()},[user]);
 if(!user||user.role!=='admin')return null;

 const save=async()=>{
  if(!form.breed_name.trim()){notify('ข้อมูลไม่ครบ','กรุณากรอกชื่อสายพันธุ์');return}
  const body={breed_name:form.breed_name.trim(),description:form.description||null,image_url:form.image_url||null};
  try{
   const r=await fetch(editing?`${API}/${editing.breed_id}`:API,{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
   const d=await r.json();
   if(!r.ok)throw new Error(d.message||'บันทึกไม่สำเร็จ');
   setEditing(null);setForm(empty);await load();
   notify('สำเร็จ',editing?'แก้ไขสายพันธุ์แล้ว':'เพิ่มสายพันธุ์แล้ว');
  }catch(e){notify('ผิดพลาด',e instanceof Error?e.message:'บันทึกไม่สำเร็จ')}
 };
 const edit=(b:Breed)=>{setEditing(b);setForm({breed_name:b.breed_name,description:b.description||'',image_url:b.image_url||''})};
 const del=(b:Breed)=>{
  const run=async()=>{try{const r=await fetch(`${API}/${b.breed_id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});if(!r.ok)throw new Error((await r.json()).message||'ลบไม่สำเร็จ');await load()}catch(e){notify('ผิดพลาด',e instanceof Error?e.message:'ลบไม่สำเร็จ')}};
  if(Platform.OS==='web'){if(window.confirm(`ลบ ${b.breed_name} ?`))run()}else{Alert.alert('ยืนยันการลบ',b.breed_name,[{text:'ยกเลิก'},{text:'ลบ',style:'destructive',onPress:run}])}
 };

 const filteredItems=useMemo(()=>{const q=search.trim().toLowerCase();return items.filter(b=>!q||`${b.breed_id} ${b.breed_name} ${b.description||''}`.toLowerCase().includes(q))},[items,search]);
 return <SafeAreaView style={s.container}>
  <View style={s.header}>
   <TouchableOpacity onPress={()=>router.back()}><Ionicons name="arrow-back" size={24} color={C.pink}/></TouchableOpacity>
   <View><Text style={s.title}>จัดการสายพันธุ์</Text><Text style={s.sub}>Breeds ตามโครงสร้าง SQL</Text></View>
   <TouchableOpacity onPress={load}><Ionicons name="refresh" size={21} color={C.pink}/></TouchableOpacity>
  </View>
  <ScrollView contentContainerStyle={s.content}>
   <View style={s.form}>
    <Text style={s.section}>{editing?'แก้ไขสายพันธุ์':'เพิ่มสายพันธุ์'}</Text>
    <Text style={s.label}>ชื่อสายพันธุ์</Text>
    <TextInput style={s.input} value={form.breed_name} onChangeText={v=>setForm({...form,breed_name:v})} placeholder="Himalayan Cat" placeholderTextColor="#B49BA4"/>
    <Text style={s.label}>Image URL</Text>
    <TextInput style={s.input} value={form.image_url} onChangeText={v=>setForm({...form,image_url:v})} placeholder="https://..." placeholderTextColor="#B49BA4"/>
    <Text style={s.label}>รายละเอียด</Text>
    <TextInput style={[s.input,s.area]} value={form.description} onChangeText={v=>setForm({...form,description:v})} placeholder="Description" placeholderTextColor="#B49BA4" multiline/>
    <View style={s.formBtns}>
     {editing&&<TouchableOpacity style={s.cancel} onPress={()=>{setEditing(null);setForm(empty)}}><Text style={s.cancelText}>ยกเลิก</Text></TouchableOpacity>}
     <TouchableOpacity style={s.save} onPress={save}><Text style={s.saveText}>{editing?'บันทึกการแก้ไข':'เพิ่มสายพันธุ์'}</Text></TouchableOpacity>
    </View>
   </View>
   <Text style={s.section}>รายการสายพันธุ์ ({filteredItems.length}/{items.length})</Text>
   <View style={s.search}><Ionicons name="search" size={18} color={C.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="ค้นหาชื่อ Breed / Breed ID" placeholderTextColor="#B49BA4" style={s.searchInput}/>{search!==''&&<TouchableOpacity onPress={()=>setSearch('')}><Ionicons name="close-circle" size={18} color={C.muted}/></TouchableOpacity>}</View>
   {loading?<ActivityIndicator color={C.pink}/>:filteredItems.length===0?<View style={s.empty}><Ionicons name="search-outline" size={30} color={C.muted}/><Text style={s.muted}>ไม่พบสายพันธุ์ที่ค้นหา</Text></View>:filteredItems.map(b=>
    <View key={b.breed_id} style={s.card}>
     {b.image_url?<Image source={{uri:b.image_url}} style={s.image}/>:<View style={s.imageEmpty}><Ionicons name="paw" size={28} color={C.pink}/></View>}
     <View style={{flex:1}}>
      <Text style={s.name}>{b.breed_name}</Text>
      <Text style={s.meta}>Breed ID {b.breed_id}</Text>
      <Text style={s.meta} numberOfLines={2}>{b.description||'ไม่มีรายละเอียด'}</Text>
     </View>
     <View style={s.actions}>
      <TouchableOpacity onPress={()=>edit(b)}><Ionicons name="create-outline" size={21} color={C.pink}/></TouchableOpacity>
      <TouchableOpacity onPress={()=>del(b)}><Ionicons name="trash-outline" size={21} color={C.danger}/></TouchableOpacity>
     </View>
    </View>
   )}
  </ScrollView>
 </SafeAreaView>;
}

const s=StyleSheet.create({
 container:{flex:1,backgroundColor:C.bg},
 header:{height:68,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderColor:C.border,backgroundColor:C.white},
 title:{fontSize:19,fontWeight:'900',color:C.ink},
 sub:{fontSize:10,color:C.muted},
 content:{width:'100%',maxWidth:900,alignSelf:'center',padding:20,paddingBottom:50},
 form:{backgroundColor:C.white,borderWidth:1,borderColor:C.border,padding:18,marginBottom:20},
 section:{fontSize:18,fontWeight:'900',color:C.ink,marginBottom:12},
 label:{fontSize:12,fontWeight:'800',color:C.ink,marginTop:10,marginBottom:5},
 input:{height:45,borderWidth:1,borderColor:C.border,backgroundColor:'#FFFBFC',paddingHorizontal:11,color:C.ink,fontSize:13},
 area:{height:80,paddingTop:11,textAlignVertical:'top'},
 formBtns:{flexDirection:'row',gap:9,marginTop:15},
 save:{height:45,backgroundColor:C.pink,paddingHorizontal:20,alignItems:'center',justifyContent:'center'},
 saveText:{color:'#fff',fontWeight:'900'},
 cancel:{height:45,borderWidth:1,borderColor:C.border,paddingHorizontal:20,alignItems:'center',justifyContent:'center'},
 cancelText:{color:C.ink,fontWeight:'800'},
 card:{backgroundColor:C.white,borderWidth:1,borderColor:C.border,padding:12,marginBottom:9,flexDirection:'row',alignItems:'center',gap:12},
 image:{width:65,height:65,resizeMode:'cover',backgroundColor:C.soft},
 imageEmpty:{width:65,height:65,backgroundColor:C.soft,alignItems:'center',justifyContent:'center'},
 name:{fontSize:14,fontWeight:'900',color:C.ink},
 meta:{fontSize:11,color:C.muted,marginTop:4},
 actions:{gap:12,paddingHorizontal:4},search:{height:45,borderWidth:1,borderColor:C.border,backgroundColor:C.white,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},searchInput:{flex:1,color:C.ink,fontSize:13},empty:{padding:35,alignItems:'center',gap:8},muted:{fontSize:13,color:C.muted},
});
