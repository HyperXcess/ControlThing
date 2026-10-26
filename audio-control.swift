import Foundation
import CoreAudio
func address(_ selector: AudioObjectPropertySelector) -> AudioObjectPropertyAddress { AudioObjectPropertyAddress(mSelector:selector,mScope:kAudioObjectPropertyScopeGlobal,mElement:kAudioObjectPropertyElementMain) }
func outputs() -> [[String:Any]] {
 var a=address(kAudioHardwarePropertyDevices),size:UInt32=0
 guard AudioObjectGetPropertyDataSize(AudioObjectID(kAudioObjectSystemObject),&a,0,nil,&size)==noErr else{return []}
 var ids=[AudioDeviceID](repeating:0,count:Int(size)/MemoryLayout<AudioDeviceID>.size)
 guard AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject),&a,0,nil,&size,&ids)==noErr else{return []}
 var result=[[String:Any]]()
 for id in ids {
  var streams=AudioObjectPropertyAddress(mSelector:kAudioDevicePropertyStreams,mScope:kAudioDevicePropertyScopeOutput,mElement:kAudioObjectPropertyElementMain),bytes:UInt32=0
  guard AudioObjectGetPropertyDataSize(id,&streams,0,nil,&bytes)==noErr && bytes>0 else{continue}
  var name:CFString="" as CFString;var nameSize=UInt32(MemoryLayout<CFString>.size);var n=address(kAudioObjectPropertyName)
  if AudioObjectGetPropertyData(id,&n,0,nil,&nameSize,&name)==noErr {result.append(["id":id,"name":name as String])}
 }
 return result
}
let args=CommandLine.arguments
if args.count==3 && args[1]=="set",let id=UInt32(args[2]),outputs().contains(where:{($0["id"] as? UInt32)==id}) {
 var a=address(kAudioHardwarePropertyDefaultOutputDevice),device=AudioDeviceID(id)
 if AudioObjectSetPropertyData(AudioObjectID(kAudioObjectSystemObject),&a,0,nil,UInt32(MemoryLayout<AudioDeviceID>.size),&device) != noErr {exit(1)}
}
var a=address(kAudioHardwarePropertyDefaultOutputDevice),current=AudioDeviceID(0),size=UInt32(MemoryLayout<AudioDeviceID>.size)
_ = AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject),&a,0,nil,&size,&current)
func volumeAddress(_ element: UInt32) -> AudioObjectPropertyAddress { AudioObjectPropertyAddress(mSelector:kAudioDevicePropertyVolumeScalar,mScope:kAudioDevicePropertyScopeOutput,mElement:element) }
func readable(_ element: UInt32) -> Float32? {
 var a=volumeAddress(element),v:Float32=0,n=UInt32(MemoryLayout<Float32>.size)
 return AudioObjectGetPropertyData(current,&a,0,nil,&n,&v)==noErr ? v : nil
}
if args.count==3 && args[1]=="volume",let percent=Float32(args[2]),percent>=0,percent<=100 {
 var changed=false
 for element:UInt32 in [0,1,2] {
  var a=volumeAddress(element),settable:DarwinBoolean=false
  if AudioObjectIsPropertySettable(current,&a,&settable)==noErr && settable.boolValue {
   var value=percent/100
   if AudioObjectSetPropertyData(current,&a,0,nil,UInt32(MemoryLayout<Float32>.size),&value)==noErr {changed=true}
   if element==0 && changed {break}
  }
 }
 if !changed {FileHandle.standardError.write(Data("This audio output has fixed volume.".utf8));exit(1)}
}
let values=[readable(0)].compactMap{$0},channels=[readable(1),readable(2)].compactMap{$0}
let levels=values.isEmpty ? channels : values
var result:[String:Any]=["devices":outputs(),"current":current]
result["volume"]=levels.isEmpty ? NSNull() : Int((levels.reduce(0,+)/Float32(levels.count)*100).rounded()) as Any
let data=try JSONSerialization.data(withJSONObject:result)
FileHandle.standardOutput.write(data)
