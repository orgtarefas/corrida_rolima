// Adicione isso ao seu game-script.js existente

// ==================== SISTEMA DE CARROS 3D ====================

let currentCarModel = null;
let carMaterial = null;

// Função para criar o modelo 3D do carro no PlayCanvas
function criarCarro3D(carId, posicao = { x: 0, y: 0, z: 0 }) {
    const carro = CARROS[carId];
    if (!carro) return null;
    
    // Criar um grupo para o carro
    const carGroup = new pc.Entity('carro_' + carId);
    carGroup.setPosition(posicao.x, posicao.y, posicao.z);
    
    // Criar material da cor do carro
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(carro.cor);
    material.update();
    
    if (carId === 'carro1') {
        // CARRO 1: Modelo Esportivo (baixo e largo)
        
        // Carroceria principal (cubo alongado)
        const body = new pc.Entity('body');
        body.addComponent('model', {
            type: 'box'
        });
        body.setLocalScale(1.2, 0.4, 2.0);
        body.setLocalPosition(0, 0.2, 0);
        body.model.model.meshInstances[0].material = material;
        carGroup.addChild(body);
        
        // Teto (meio cilindro - usando esfera achatada)
        const roof = new pc.Entity('roof');
        roof.addComponent('model', {
            type: 'sphere'
        });
        roof.setLocalScale(0.8, 0.3, 1.0);
        roof.setLocalPosition(0, 0.5, 0);
        const roofMat = new pc.StandardMaterial();
        roofMat.diffuse = new pc.Color(0.2, 0.2, 0.2);
        roofMat.update();
        roof.model.model.meshInstances[0].material = roofMat;
        carGroup.addChild(roof);
        
        // Rodas
        const rodaMat = new pc.StandardMaterial();
        rodaMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
        rodaMat.update();
        
        const posicoesRodas = [
            { x: -0.8, z: -0.7 }, // frente esq
            { x: 0.8, z: -0.7 },  // frente dir
            { x: -0.8, z: 0.7 },  // trás esq
            { x: 0.8, z: 0.7 }    // trás dir
        ];
        
        posicoesRodas.forEach(pos => {
            const wheel = new pc.Entity('wheel');
            wheel.addComponent('model', {
                type: 'cylinder'
            });
            wheel.setLocalScale(0.4, 0.4, 0.2);
            wheel.setLocalPosition(pos.x, 0.1, pos.z);
            wheel.model.model.meshInstances[0].material = rodaMat;
            carGroup.addChild(wheel);
        });
        
        // Spoiler (opcional)
        const spoiler = new pc.Entity('spoiler');
        spoiler.addComponent('model', {
            type: 'box'
        });
        spoiler.setLocalScale(1.0, 0.1, 0.1);
        spoiler.setLocalPosition(0, 0.45, -1.0);
        const spoilerMat = new pc.StandardMaterial();
        spoilerMat.diffuse = new pc.Color(0.8, 0.2, 0.2);
        spoilerMat.update();
        spoiler.model.model.meshInstances[0].material = spoilerMat;
        carGroup.addChild(spoiler);
        
    } else if (carId === 'carro2') {
        // CARRO 2: Modelo Caminhonete (mais alto e robusto)
        
        // Carroceria principal
        const body = new pc.Entity('body');
        body.addComponent('model', {
            type: 'box'
        });
        body.setLocalScale(1.4, 0.6, 2.2);
        body.setLocalPosition(0, 0.3, 0);
        body.model.model.meshInstances[0].material = material;
        carGroup.addChild(body);
        
        // Caçamba (parte traseira)
        const bed = new pc.Entity('bed');
        bed.addComponent('model', {
            type: 'box'
        });
        bed.setLocalScale(1.3, 0.4, 1.0);
        bed.setLocalPosition(0, 0.6, 0.6);
        const bedMat = new pc.StandardMaterial();
        bedMat.diffuse = new pc.Color(0.4, 0.4, 0.4);
        bedMat.update();
        bed.model.model.meshInstances[0].material = bedMat;
        carGroup.addChild(bed);
        
        // Cabine
        const cabin = new pc.Entity('cabin');
        cabin.addComponent('model', {
            type: 'box'
        });
        cabin.setLocalScale(1.2, 0.5, 0.8);
        cabin.setLocalPosition(0, 0.65, -0.6);
        const cabinMat = new pc.StandardMaterial();
        cabinMat.diffuse = new pc.Color(0.3, 0.5, 0.8);
        cabinMat.update();
        cabin.model.model.meshInstances[0].material = cabinMat;
        carGroup.addChild(cabin);
        
        // Rodas maiores
        const rodaMat = new pc.StandardMaterial();
        rodaMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
        rodaMat.update();
        
        const posicoesRodas = [
            { x: -1.0, z: -0.9 },
            { x: 1.0, z: -0.9 },
            { x: -1.0, z: 0.9 },
            { x: 1.0, z: 0.9 }
        ];
        
        posicoesRodas.forEach(pos => {
            const wheel = new pc.Entity('wheel');
            wheel.addComponent('model', {
                type: 'cylinder'
            });
            wheel.setLocalScale(0.5, 0.5, 0.3);
            wheel.setLocalPosition(pos.x, 0.2, pos.z);
            wheel.model.model.meshInstances[0].material = rodaMat;
            carGroup.addChild(wheel);
        });
        
        // Para-choque dianteiro
        const bumper = new pc.Entity('bumper');
        bumper.addComponent('model', {
            type: 'box'
        });
        bumper.setLocalScale(1.2, 0.2, 0.2);
        bumper.setLocalPosition(0, 0.2, -1.2);
        const bumperMat = new pc.StandardMaterial();
        bumperMat.diffuse = new pc.Color(0.7, 0.7, 0.7);
        bumperMat.update();
        bumper.model.model.meshInstances[0].material = bumperMat;
        carGroup.addChild(bumper);
    }
    
    return carGroup;
}

// Função para atualizar o carro na cena 3D
function atualizarCarro3D(carId) {
    if (!window.app) {
        console.warn('PlayCanvas app não inicializado');
        return;
    }
    
    // Remover carro atual se existir
    if (currentCarModel) {
        currentCarModel.destroy();
    }
    
    // Criar novo carro
    currentCarModel = criarCarro3D(carId, { x: 0, y: 0, z: 0 });
    
    if (currentCarModel) {
        window.app.root.addChild(currentCarModel);
        console.log(`✅ Carro 3D atualizado para: ${CARROS[carId].nome}`);
    }
}

// Quando o jogo iniciar, carregar o carro selecionado
function initCarSystem() {
    const carroId = localStorage.getItem('carroSelecionado') || 'carro1';
    atualizarCarro3D(carroId);
}