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
let data=try JSONSerialization.data(withJSONObject:["devices":outputs(),"current":current])
FileHandle.standardOutput.write(data)
