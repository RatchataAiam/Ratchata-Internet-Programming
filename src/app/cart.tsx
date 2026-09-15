import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context-cart';

const C={bg:'#FFF8FA',white:'#FFF',ink:'#2D2025',muted:'#7E6870',pink:'#E75480',pinkDark:'#C83D68',border:'#EBCFD8',soft:'#FFF0F4',danger:'#B93859'};
const notify=(t:string,m:string)=>Platform.OS==='web'?window.alert(`${t}\n\n${m}`):Alert.alert(t,m);

export default function Cart(){
 const {items,total,count,removeItem,setQuantity}=useCart();
 return <SafeAreaView style={s.container}><StatusBar barStyle="dark-content" backgroundColor={C.bg}/>
  <View style={s.header}><TouchableOpacity onPress={()=>router.back()}><Ionicons name="arrow-back" size={25} color={C.pink}/></TouchableOpacity><View><Text style={s.title}>ตะกร้าสินค้า</Text><Text style={s.sub}>{count} รายการ</Text></View><View style={{width:25}}/></View>
  {items.length===0?<View style={s.empty}><Ionicons name="cart-outline" size={55} color={C.pink}/><Text style={s.emptyTitle}>ตะกร้ายังว่าง</Text><Text style={s.muted}>เลือกแมวหรือสินค้าที่ต้องการ แล้วเพิ่มลงตะกร้าได้เลย</Text><TouchableOpacity style={s.continue} onPress={()=>router.replace('/')}><Text style={s.continueText}>เลือกสินค้าต่อ</Text></TouchableOpacity></View>:
  <ScrollView contentContainerStyle={s.content}>
   {items.map(item=><View key={item.key} style={s.card}>
    {item.image_url?<Image source={{uri:item.image_url}} style={s.image}/>:<View style={s.imageEmpty}><Ionicons name={item.item_type==='Cat'?'paw':'cube-outline'} size={30} color={C.pink}/></View>}
    <View style={{flex:1}}><Text style={s.name}>{item.name}</Text><Text style={s.type}>{item.item_type==='Cat'?'แมว':'สินค้า'}</Text><Text style={s.price}>฿{Number(item.price).toLocaleString()}</Text></View>
    <View style={s.right}><TouchableOpacity onPress={()=>removeItem(item.key)}><Ionicons name="trash-outline" size={20} color={C.danger}/></TouchableOpacity>
      {item.item_type==='Product'&&<View style={s.qty}><TouchableOpacity onPress={()=>item.quantity>1?setQuantity(item.key,item.quantity-1):removeItem(item.key)}><Ionicons name="remove" size={17} color={C.pink}/></TouchableOpacity><Text style={s.qtyText}>{item.quantity}</Text><TouchableOpacity onPress={()=>setQuantity(item.key,item.quantity+1)}><Ionicons name="add" size={17} color={C.pink}/></TouchableOpacity></View>}
      <Text style={s.lineTotal}>฿{(Number(item.price)*item.quantity).toLocaleString()}</Text>
    </View>
   </View>)}
   <View style={s.summary}><Text style={s.summaryLabel}>ยอดรวมทั้งหมด</Text><Text style={s.summaryValue}>฿{total.toLocaleString()}</Text></View>
   <View style={s.buttons}><TouchableOpacity style={s.backBtn} onPress={()=>router.back()}><Text style={s.backText}>เลือกสินค้าต่อ</Text></TouchableOpacity><TouchableOpacity style={s.checkout} onPress={()=>router.push('/checkout')}><Ionicons name="cart" size={18} color="#fff"/><Text style={s.checkoutText}>ไปชำระเงิน</Text></TouchableOpacity></View>
  </ScrollView>}
 </SafeAreaView>
}
const s=StyleSheet.create({container:{flex:1,backgroundColor:C.bg},header:{height:68,paddingHorizontal:20,flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:C.white,borderBottomWidth:1,borderColor:C.border},title:{fontSize:20,fontWeight:'900',color:C.ink},sub:{fontSize:11,color:C.muted,marginTop:2},content:{width:'100%',maxWidth:850,alignSelf:'center',padding:20,paddingBottom:50},card:{backgroundColor:C.white,borderWidth:1,borderColor:C.border,padding:13,marginBottom:10,flexDirection:'row',alignItems:'center',gap:12},image:{width:78,height:78,backgroundColor:C.soft},imageEmpty:{width:78,height:78,backgroundColor:C.soft,alignItems:'center',justifyContent:'center'},name:{fontSize:14,fontWeight:'900',color:C.ink},type:{fontSize:11,color:C.muted,marginTop:3},price:{fontSize:15,fontWeight:'900',color:C.pinkDark,marginTop:5},right:{alignItems:'flex-end',gap:8},qty:{height:34,borderWidth:1,borderColor:C.border,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:8},qtyText:{fontWeight:'900',color:C.ink},lineTotal:{fontSize:13,fontWeight:'900',color:C.ink},summary:{marginTop:8,paddingTop:18,borderTopWidth:1,borderColor:C.border,flexDirection:'row',justifyContent:'space-between'},summaryLabel:{fontWeight:'800',color:C.muted},summaryValue:{fontSize:23,fontWeight:'900',color:C.pinkDark},buttons:{flexDirection:'row',gap:10,marginTop:18},backBtn:{height:50,borderWidth:1,borderColor:C.pink,flex:1,alignItems:'center',justifyContent:'center'},backText:{color:C.pinkDark,fontWeight:'900'},checkout:{height:50,backgroundColor:C.pink,flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},checkoutText:{color:'#fff',fontWeight:'900'},empty:{flex:1,alignItems:'center',justifyContent:'center',padding:30},emptyTitle:{fontSize:21,fontWeight:'900',color:C.ink,marginTop:14},muted:{fontSize:13,color:C.muted,textAlign:'center',marginTop:6},continue:{height:46,paddingHorizontal:22,backgroundColor:C.pink,alignItems:'center',justifyContent:'center',marginTop:18},continueText:{color:'#fff',fontWeight:'900'}});
