import * as THREE from 'three';
import { useThree, useFrame, Canvas, useLoader } from '@react-three/fiber';
import { Html, Mask, useMask, OrthographicCamera, Clone, Float as FloatImpl, OrbitControls } from '@react-three/drei'
import { useEffect, useRef, useState, Suspense } from 'react';
import useSpline from '@splinetool/r3f-spline'
import Embed from '../component/Embed'
import smoke from '../assets/smoke.png';

import { SceneContainer } from '../component/SceneContainer';
import { FooterCanvas } from '../component/FooterCanvas';

function Rig() {
    const camera = useThree((state) => state.camera)
    return useFrame(({ clock }) => {
        // camera.rotation.x = clock.getElapsedTime() * 0.01,
        // camera.rotation.y = clock.getElapsedTime() * 0.01,
        camera.rotation.z = clock.getElapsedTime() * 0.1
    })

}

const Home = () => {
    const container = useRef();
    const domContent = useRef();
    const colorMap = useLoader(THREE.TextureLoader, smoke);

    const meshTexture = (colorMap) => {
        const x = Math.random() * 0.2;
        const rotate = Math.random() * 2 * Math.PI;
        return (<mesh visible position={[x, x, x]} rotation={[0, 0, 0]} castShadow>
            <sphereGeometry attach='geometry' args={[2, 12, 32]} />
            <meshBasicMaterial
                attach='material'
                color='white'
                map={colorMap}
                transparent={true} />
            <Rig />
        </mesh>)
    }
    return (
        <div className='absolute w-full h-full top-0 left-0 overflow-hidden' ref={container}>
            <Canvas shadows flat linear eventSource={container.current} camera={[1.5, 1.5, 1.5]}>
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[-1, 2, 2]} intensity={4} />
                    {/* {meshTexture(colorMap)} */}
                    {/* <SceneContainer /> */}
                    <FooterCanvas shape={'sphere'} count={10} />
                    <OrbitControls  />
                </Suspense>
            </Canvas >
        </div>
    );
};

function Scene({ portal, ...props }) {
    let timeout = null
    const v = new THREE.Vector3()
    const wheel = useRef(0)
    const hand = useRef()
    const [clicked, click] = useState(false)
    const { nodes } = useSpline('./scroll.splinecode')
    // Take the stencil and drop it over everything but the right hand
    const stencil = useMask(1, true)
    useLayoutEffect(() => {
        Object.values(nodes).forEach(
            (node) =>
                node.material &&
                node.parent.name !== 'hand-r' &&
                node.name !== 'Cube3' &&
                node.name !== 'Cube 8' &&
                node.name !== 'Cube 17' &&
                node.name !== 'Cube 24' &&
                Object.assign(node.material, stencil),
        )
    }, [])
    useFrame((state) => {
        v.copy({ x: state.pointer.x, y: state.pointer.y, z: 0 })
        v.unproject(state.camera)
        hand.current.rotation.x = THREE.MathUtils.lerp(hand.current.rotation.x, clicked ? -0.7 : -0.5, 0.2)
        hand.current.position.lerp({ x: v.x - 100, y: wheel.current + v.y, z: v.z }, 0.4)
        state.camera.zoom = THREE.MathUtils.lerp(state.camera.zoom, clicked ? 0.9 : 0.7, clicked ? 0.025 : 0.15)
        state.camera.position.lerp({ x: -state.pointer.x * 400, y: -state.pointer.y * 200, z: 1000 }, 0.1)
        state.camera.lookAt(0, 0, 0)
        state.camera.updateProjectionMatrix()
    })
    return (
        <group {...props} dispose={null}>
            <Float object={nodes['Bg-stuff']} />
            <Float object={nodes['Emoji-4']} />
            <Float object={nodes['Emoji-2']} />
            <Float object={nodes['Emoji-3']} />
            <Float object={nodes['Emoji-1']} />
            <Float object={nodes['Icon-text-2']} />
            <Float object={nodes['Icon-like']} />
            <Float object={nodes['Icon-star']} />
            <Float object={nodes['Icon-play']} />
            <Float object={nodes['Icon-text-1']} />
            <group ref={hand}>
                <Clone object={nodes['hand-r']} rotation-y={0.35} />
            </group>
            <Clone object={nodes['Bubble-BG']} scale={1.25} />
            <FloatImpl floatIntensity={100} rotationIntensity={0.5} speed={1}>
                <Float intensity={100} rotation={0.5} object={nodes['Bubble-LOGO']} position={[0, -0, 0]} scale={1.5} />
                <group position={[0, -50, 0]} rotation={[-0.15, 0, 0]}>
                    <Clone object={nodes['hand-l']} position={[80, 100, -150]} />
                    <group name="phone" position={[-50, 0, -68]}>
                        <Clone object={[nodes['Rectangle 4'], nodes['Rectangle 3'], nodes['Boolean 2']]} />
                        {/* Mask is a drei component that generates a stencil, we use the phone-screen as a mask, punching a hole into the canvas */}
                        <Mask id={1} colorWrite={false} depthWrite={false} geometry={nodes.screen.geometry} castShadow receiveShadow position={[0, 0, 9.89]}>
                            {/* We can drop the HTML inside, make it a 3d-transform and portal it to the dom container above */}
                            <Html className="content-embed" portal={portal} scale={40} transform zIndexRange={[-1, 0]}>
                                <Embed />
                            </Html>
                        </Mask>
                        <mesh
                            onWheel={(e) => {
                                wheel.current = -e.deltaY / 2
                                // Simple defer to reset wheel offset since the browser will never let delta be zero
                                clearTimeout(timeout)
                                timeout = setTimeout(() => (wheel.current = 0), 100)
                            }}
                            onPointerDown={(e) => {
                                e.target.setPointerCapture(e.pointerId)
                                click(true)
                            }}
                            onPointerUp={(e) => {
                                e.target.releasePointerCapture(e.pointerId)
                                click(false)
                            }}
                            receiveShadow
                            geometry={nodes.screen.geometry}>
                            <meshStandardMaterial transparent opacity={0.1} />
                        </mesh>
                    </group>
                </group>
            </FloatImpl>
        </group>
    )
}

const Float = ({ object, intensity = 300, rotation = 1, ...props }) => (
    <FloatImpl floatIntensity={intensity} rotationIntensity={rotation} speed={2}>
        <Clone object={object} {...props} />
    </FloatImpl>
)



export default Home;